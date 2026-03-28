import express from 'express';
import { aiService, chatbotService, conversationService, utilityService, validationService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';
import { ensureChatbotOwnership } from './chatbot.js';

const router = express.Router();

const processChatMessage = async ({ user, chatbot, conversationId, userMessage }) => {
  let conversation = await conversationService.getConversationForChat(user._id, chatbot._id, conversationId, userMessage);

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  if (conversationId) {
    await conversationService.appendMessage(conversation, 'user', userMessage, utilityService.estimateTokens(userMessage));
    conversation = await conversationService.getOwnedConversation(user._id, conversationId);
  }

  return conversation;
};

const streamAssistantReply = async ({ chatbot, conversation, userMessage, onChunk, onDone, onError }) => {
  let assistantText = '';
  let tokensUsed = 0;
  let apiCallsMade = 0;
  let lead = null;
  let escalated = false;

  try {
    const stream = aiService.streamResponse(chatbot, conversation, userMessage);
    for await (const event of stream) {
      if (event.type === 'chunk') {
        assistantText += event.content;
        onChunk?.(event.content);
      } else if (event.type === 'done') {
        assistantText = event.content;
        tokensUsed = event.tokensUsed || 0;
        apiCallsMade = event.apiCallsMade || 0;
        lead = event.lead || null;
        escalated = event.escalated || false;
      } else if (event.type === 'error') {
        apiCallsMade = event.apiCallsMade || 0;

        if (assistantText) {
          tokensUsed = utilityService.estimateTokens(assistantText);
          await conversationService.appendMessage(conversation, 'assistant', assistantText, tokensUsed, { apiCallsMade, lead, leadCaptured: Boolean(lead?.email || lead?.phone), escalated });
        }

        onError?.({
          message: event.message,
          details: event.details,
          conversationId: conversation._id,
          partial: assistantText
        });

        return;
      }
    }

    await conversationService.appendMessage(conversation, 'assistant', assistantText, tokensUsed, {
      apiCallsMade,
      lead,
      leadCaptured: Boolean(lead?.email || lead?.phone),
      escalated
    });

    await conversationService.buildAnalytics(chatbot._id);

    onDone?.({
      conversationId: conversation._id,
      content: assistantText,
      tokensUsed,
      apiCallsMade,
      lead,
      escalated
    });
  } catch (error) {
    onError?.({ message: 'Streaming failed', details: error.message, conversationId: conversation._id, partial: assistantText });
  }
};

router.use(authService.authenticate);

router.post('/chat/:chatbotId/message', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  const errors = validationService.validateChatMessage(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  const userMessage = utilityService.sanitizeString(req.body.message, 10000);
  const conversation = await processChatMessage({ user: req.user, chatbot: req.chatbot, conversationId: req.body.conversationId, userMessage });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const writeEvent = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  await streamAssistantReply({
    chatbot: req.chatbot,
    conversation,
    userMessage,
    onChunk: (content) => writeEvent('chunk', { content }),
    onDone: (payloadData) => { writeEvent('done', payloadData); res.end(); },
    onError: (payloadData) => { writeEvent('error', payloadData); res.end(); }
  });
}));

router.get('/conversations/:chatbotId/recent', asyncHandler(async (req, res) => {
  const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.chatbotId);
  if (!chatbot) {
    return res.status(404).json({ success: false, message: 'Chatbot not found' });
  }

  const conversations = await conversationService.listRecentConversations(req.user._id, chatbot._id, Number(req.query.limit) || 10);
  res.json({ success: true, conversations });
}));

router.get('/conversations/:id', asyncHandler(async (req, res) => {
  const conversation = await conversationService.getOwnedConversation(req.user._id, req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  res.json({ success: true, conversation });
}));

router.post('/conversations/:id/export', asyncHandler(async (req, res) => {
  const conversation = await conversationService.exportConversation(req.user._id, req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  res.json({ success: true, conversation });
}));

router.get('/analytics/:chatbotId', asyncHandler(async (req, res) => {
  const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.chatbotId);
  if (!chatbot) {
    return res.status(404).json({ success: false, message: 'Chatbot not found' });
  }

  const analytics = await conversationService.buildAnalytics(chatbot._id);
  res.json({ success: true, analytics });
}));

router.get('/usage/:chatbotId', asyncHandler(async (req, res) => {
  const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.chatbotId);
  if (!chatbot) {
    return res.status(404).json({ success: false, message: 'Chatbot not found' });
  }

  const analytics = await conversationService.buildAnalytics(chatbot._id);
  res.json({
    success: true,
    usage: {
      chatbotId: chatbot._id,
      totalTokensUsed: analytics.stats.totalTokensUsed,
      totalMessages: analytics.stats.totalMessages,
      totalConversations: analytics.stats.totalConversations,
      apiCallsMade: analytics.stats.apiCallsMade,
      avgResponseTime: analytics.stats.avgResponseTime,
      leadsCaptured: analytics.stats.leadsCaptured,
      escalationsTriggered: analytics.stats.escalationsTriggered
    }
  });
}));

export default router;
