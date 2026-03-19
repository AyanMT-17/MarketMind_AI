import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB, User } from './database.js';
import {
  aiService,
  authService,
  chatbotService,
  conversationService,
  integrationService,
  utilityService,
  validationService,
  adCampaignService,
  businessMetricsService,
  businessPredictionService
} from './services.js';

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const buildAllowedOrigins = () => [...new Set([...DEFAULT_ALLOWED_ORIGINS, process.env.CLIENT_URL].filter(Boolean))];

const buildGeneralLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

const buildAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const buildChatLimiter = () => rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?._id || ipKeyGenerator(req)}:${req.params.chatbotId}`,
  message: {
    success: false,
    message: 'Too many chatbot messages, please slow down.'
  }
});

const buildIntegrationLimiter = () => rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?._id || ipKeyGenerator(req)}:${req.params.id || req.body.chatbotId || 'integration'}`,
  message: {
    success: false,
    message: 'Too many integration requests, please try again later.'
  }
});

const resolveAuthenticatedUser = async (token) => {
  const decoded = authService.verifyToken(token);
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error('Authentication failed');
  }
  return user;
};

const processChatMessage = async ({ user, chatbot, conversationId, userMessage }) => {
  let conversation = await conversationService.getConversationForChat(
    user._id,
    chatbot._id,
    conversationId,
    userMessage
  );

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  if (conversationId) {
    await conversationService.appendMessage(
      conversation,
      'user',
      userMessage,
      utilityService.estimateTokens(userMessage)
    );
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
    onError?.({
      message: 'Streaming failed',
      details: error.message,
      conversationId: conversation._id,
      partial: assistantText
    });
  }
};

const ensureChatbotOwnership = async (req, res, next) => {
  const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.id || req.params.chatbotId);
  if (!chatbot) {
    return res.status(404).json({ success: false, message: 'Chatbot not found' });
  }

  req.chatbot = chatbot;
  return next();
};

const configureSocketServer = (io) => {
  io.use(async (socket, next) => {
    try {
      const rawAuth = socket.handshake.auth?.token || socket.handshake.headers.authorization || '';
      const token = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7) : rawAuth;

      if (!token) {
        throw new Error('Authentication token is required');
      }

      socket.data.user = await resolveAuthenticatedUser(token);
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('send_message', async (payload = {}) => {
      try {
        const user = socket.data.user;
        const errors = validationService.validateChatMessage(payload);
        if (errors.length > 0) {
          socket.emit('chat_error', { message: 'Validation failed', errors });
          return;
        }

        const chatbot = await chatbotService.getOwnedChatbot(user._id, payload.chatbotId);
        if (!chatbot) {
          socket.emit('chat_error', { message: 'Chatbot not found' });
          return;
        }

        const userMessage = utilityService.sanitizeString(payload.message, 10000);
        const conversation = await processChatMessage({
          user,
          chatbot,
          conversationId: payload.conversationId,
          userMessage
        });

        const room = `conversation:${conversation._id}`;
        socket.join(room);
        io.to(room).emit('user_message', {
          conversationId: conversation._id,
          message: {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
          }
        });

        await streamAssistantReply({
          chatbot,
          conversation,
          userMessage,
          onChunk: (content) => {
            io.to(room).emit('response_chunk', {
              conversationId: conversation._id,
              content
            });
          },
          onDone: (payloadData) => {
            io.to(room).emit('response_done', payloadData);
          },
          onError: (payloadData) => {
            io.to(room).emit('chat_error', payloadData);
          }
        });
      } catch (error) {
        socket.emit('chat_error', { message: error.message || 'Socket chat failed' });
      }
    });
  });
};

export const createApp = () => {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();
  const generalLimiter = buildGeneralLimiter();
  const authLimiter = buildAuthLimiter();
  const chatbotChatLimiter = buildChatLimiter();
  const integrationLimiter = buildIntegrationLimiter();

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use('/api', generalLimiter);

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/', (req, res) => {
    res.send('Welcome to MarketMind AI Server');
  });

  app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, company } = req.body;
    const errors = validationService.validateUser(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = new User({
      email,
      password,
      profile: {
        firstName,
        lastName,
        company: company || ''
      }
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: authService.generateToken(user._id),
      user: user.toJSON()
    });
  }));

  app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      token: authService.generateToken(user._id),
      user: user.toJSON()
    });
  }));

  app.get('/api/auth/profile', authService.authenticate, (req, res) => {
    res.json({
      success: true,
      user: req.user.toJSON()
    });
  });

  app.put('/api/auth/profile', authService.authenticate, asyncHandler(async (req, res) => {
    const updates = {};

    if (req.body.email) {
      updates.email = req.body.email;
    }

    if (req.body.profile || req.body.firstName || req.body.lastName || req.body.company) {
      updates.profile = {
        firstName: req.body.profile?.firstName ?? req.body.firstName ?? req.user.profile.firstName,
        lastName: req.body.profile?.lastName ?? req.body.lastName ?? req.user.profile.lastName,
        company: req.body.profile?.company ?? req.body.company ?? req.user.profile.company,
        avatar: req.body.profile?.avatar ?? req.user.profile.avatar
      };
    }

    if (req.body.subscription) {
      updates.subscription = {
        ...req.user.subscription.toObject(),
        ...req.body.subscription
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({
      success: true,
      message: 'Profile updated',
      user: user.toJSON()
    });
  }));

  app.post('/api/chatbots', authService.authenticate, asyncHandler(async (req, res) => {
    const errors = validationService.validateChatbot(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const chatbot = await chatbotService.createChatbot(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Chatbot created successfully',
      chatbot
    });
  }));

  app.get('/api/chatbots', authService.authenticate, asyncHandler(async (req, res) => {
    const chatbots = await chatbotService.listChatbots(req.user._id);
    res.json({ success: true, chatbots });
  }));

  app.get('/api/chatbots/:id', authService.authenticate, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    res.json({ success: true, chatbot: req.chatbot });
  }));

  app.put('/api/chatbots/:id', authService.authenticate, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    const errors = validationService.validateChatbot({
      ...req.chatbot.toObject(),
      ...req.body,
      name: req.body.name ?? req.chatbot.name
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const chatbot = await chatbotService.updateConfig(req.user._id, req.chatbot._id, req.body);
    res.json({
      success: true,
      message: 'Chatbot updated successfully',
      chatbot
    });
  }));

  app.delete('/api/chatbots/:id', authService.authenticate, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    await chatbotService.deleteChatbot(req.user._id, req.chatbot._id);
    res.json({
      success: true,
      message: 'Chatbot deleted successfully'
    });
  }));

  app.get('/api/chatbots/:id/key', authService.authenticate, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    const deploymentKey = await chatbotService.generateDeploymentKey(req.user._id, req.chatbot._id);
    res.json({
      success: true,
      deploymentKey
    });
  }));

  app.post('/api/chatbots/:id/test', authService.authenticate, integrationLimiter, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    const results = await chatbotService.testIntegrations(req.user._id, req.chatbot._id);
    res.json({
      success: true,
      results
    });
  }));

  app.post('/api/integrations', authService.authenticate, integrationLimiter, asyncHandler(async (req, res) => {
    const errors = validationService.validateIntegration(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    try {
      const integration = await integrationService.createIntegration(req.user._id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Integration created successfully',
        integration
      });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }));

  app.get('/api/integrations', authService.authenticate, asyncHandler(async (req, res) => {
    const integrations = await integrationService.listIntegrations(req.user._id, req.query.chatbotId || null);
    res.json({
      success: true,
      integrations
    });
  }));

  app.put('/api/integrations/:id', authService.authenticate, integrationLimiter, asyncHandler(async (req, res) => {
    const existing = await integrationService.getOwnedIntegration(req.user._id, req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    const mergedPayload = {
      chatbotId: existing.chatbotId,
      name: req.body.name ?? existing.name,
      type: req.body.type ?? existing.type,
      config: {
        baseUrl: req.body.config?.baseUrl ?? existing.config.baseUrl,
        authType: req.body.config?.authType ?? existing.config.authType,
        authToken: req.body.config?.authToken ?? existing.config.authToken,
        headers: req.body.config?.headers ?? utilityService.serializeMap(existing.config.headers),
        endpoints: req.body.config?.endpoints ?? existing.config.endpoints.map((endpoint) => ({
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          headers: utilityService.serializeMap(endpoint.headers),
          authentication: endpoint.authentication
        }))
      }
    };

    const errors = validationService.validateIntegration(mergedPayload);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const integration = await integrationService.updateIntegration(req.user._id, req.params.id, req.body);
    res.json({
      success: true,
      message: 'Integration updated successfully',
      integration
    });
  }));

  app.delete('/api/integrations/:id', authService.authenticate, integrationLimiter, asyncHandler(async (req, res) => {
    const deleted = await integrationService.deleteIntegration(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  }));

  app.post('/api/integrations/:id/test', authService.authenticate, integrationLimiter, asyncHandler(async (req, res) => {
    const result = await integrationService.testIntegration(req.user._id, req.params.id, req.body || {});
    if (!result) {
      return res.status(404).json({ success: false, message: 'Integration not found' });
    }

    res.json({
      success: true,
      result
    });
  }));

  app.post('/api/chat/:chatbotId/message', authService.authenticate, chatbotChatLimiter, ensureChatbotOwnership, asyncHandler(async (req, res) => {
    const errors = validationService.validateChatMessage(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const userMessage = utilityService.sanitizeString(req.body.message, 10000);
    const conversation = await processChatMessage({
      user: req.user,
      chatbot: req.chatbot,
      conversationId: req.body.conversationId,
      userMessage
    });

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
      onDone: (payloadData) => {
        writeEvent('done', payloadData);
        res.end();
      },
      onError: (payloadData) => {
        writeEvent('error', payloadData);
        res.end();
      }
    });
  }));

  app.get('/api/conversations/:chatbotId/recent', authService.authenticate, asyncHandler(async (req, res) => {
    const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ success: false, message: 'Chatbot not found' });
    }

    const conversations = await conversationService.listRecentConversations(
      req.user._id,
      chatbot._id,
      Number(req.query.limit) || 10
    );

    res.json({
      success: true,
      conversations
    });
  }));

  app.get('/api/conversations/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const conversation = await conversationService.getOwnedConversation(req.user._id, req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation
    });
  }));

  app.post('/api/conversations/:id/export', authService.authenticate, asyncHandler(async (req, res) => {
    const conversation = await conversationService.exportConversation(req.user._id, req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation
    });
  }));

  app.get('/api/analytics/:chatbotId', authService.authenticate, asyncHandler(async (req, res) => {
    const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.chatbotId);
    if (!chatbot) {
      return res.status(404).json({ success: false, message: 'Chatbot not found' });
    }

    const analytics = await conversationService.buildAnalytics(chatbot._id);
    res.json({
      success: true,
      analytics
    });
  }));

  app.get('/api/usage/:chatbotId', authService.authenticate, asyncHandler(async (req, res) => {
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

  // Ad Campaign Routes
  app.post('/api/campaigns', authService.authenticate, asyncHandler(async (req, res) => {
    const campaign = await adCampaignService.createCampaign(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });
  }));

  app.get('/api/campaigns', authService.authenticate, asyncHandler(async (req, res) => {
    const campaigns = await adCampaignService.listCampaigns(req.user._id);
    res.json({
      success: true,
      campaigns
    });
  }));

  app.get('/api/campaigns/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const campaign = await adCampaignService.getCampaign(req.user._id, req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({
      success: true,
      campaign
    });
  }));

  app.put('/api/campaigns/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const campaign = await adCampaignService.updateCampaign(req.user._id, req.params.id, req.body);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });
  }));

  app.delete('/api/campaigns/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const deleted = await adCampaignService.deleteCampaign(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  }));

  app.patch('/api/campaigns/:id/performance', authService.authenticate, asyncHandler(async (req, res) => {
    const campaign = await adCampaignService.updatePerformance(req.params.id, req.body);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    res.json({
      success: true,
      message: 'Campaign performance updated',
      campaign
    });
  }));

  // Business Metrics Routes
  app.post('/api/business-metrics', authService.authenticate, asyncHandler(async (req, res) => {
    const metrics = await businessMetricsService.createMetrics(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Business metrics created successfully',
      metrics
    });
  }));

  app.get('/api/business-metrics', authService.authenticate, asyncHandler(async (req, res) => {
    const metrics = await businessMetricsService.listMetrics(req.user._id);
    res.json({
      success: true,
      metrics
    });
  }));

  app.get('/api/business-metrics/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const metrics = await businessMetricsService.getMetrics(req.user._id, req.params.id);
    if (!metrics) {
      return res.status(404).json({ success: false, message: 'Business metrics not found' });
    }

    res.json({
      success: true,
      metrics
    });
  }));

  app.put('/api/business-metrics/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const metrics = await businessMetricsService.updateMetrics(req.user._id, req.params.id, req.body);
    if (!metrics) {
      return res.status(404).json({ success: false, message: 'Business metrics not found' });
    }

    res.json({
      success: true,
      message: 'Business metrics updated successfully',
      metrics
    });
  }));

  app.delete('/api/business-metrics/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const deleted = await businessMetricsService.deleteMetrics(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Business metrics not found' });
    }

    res.json({
      success: true,
      message: 'Business metrics deleted successfully'
    });
  }));

  // Business Prediction Routes
  app.post('/api/predictions', authService.authenticate, asyncHandler(async (req, res) => {
    const { businessMetricsId, userPrompt, predictionPeriod } = req.body;
    if (!businessMetricsId || !userPrompt) {
      return res.status(400).json({
        success: false,
        message: 'Business metrics ID and user prompt are required'
      });
    }

    try {
      const prediction = await businessPredictionService.generatePrediction(req.user._id, businessMetricsId, {
        userPrompt,
        predictionPeriod: predictionPeriod || 'next_quarter'
      });

      if (!prediction) {
        return res.status(404).json({ success: false, message: 'Business metrics not found' });
      }

      res.status(201).json({
        success: true,
        message: 'Prediction generated successfully',
        prediction
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate prediction',
        error: error.message
      });
    }
  }));

  app.get('/api/predictions', authService.authenticate, asyncHandler(async (req, res) => {
    const predictions = await businessPredictionService.listPredictions(req.user._id);
    res.json({
      success: true,
      predictions
    });
  }));

  app.get('/api/predictions/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const prediction = await businessPredictionService.getPrediction(req.user._id, req.params.id);
    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.json({
      success: true,
      prediction
    });
  }));

  app.delete('/api/predictions/:id', authService.authenticate, asyncHandler(async (req, res) => {
    const deleted = await businessPredictionService.deletePrediction(req.user._id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Prediction not found' });
    }

    res.json({
      success: true,
      message: 'Prediction deleted successfully'
    });
  }));

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });

  return app;
};

export const createServer = () => {
  const app = createApp();
  const io = new SocketIOServer({
    cors: {
      origin: buildAllowedOrigins(),
      credentials: true
    }
  });

  configureSocketServer(io);
  return { app, io };
};

export const startServer = async () => {
  await connectDB();

  const { app, io } = createServer();
  const port = process.env.PORT || 5000;

  return new Promise((resolve) => {
    const serverInstance = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/api/health`);
      resolve(serverInstance);
    });

    io.attach(serverInstance);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().then((serverInstance) => {
    const shutdown = async () => {
      await new Promise((resolve) => serverInstance.close(resolve));
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });
}
