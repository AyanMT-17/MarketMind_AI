import express from 'express';
import { chatbotService, integrationService, validationService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();

const ensureChatbotOwnership = async (req, res, next) => {
  const chatbot = await chatbotService.getOwnedChatbot(req.user._id, req.params.id || req.params.chatbotId);
  if (!chatbot) {
    return res.status(404).json({ success: false, message: 'Chatbot not found' });
  }

  req.chatbot = chatbot;
  return next();
};

router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const errors = validationService.validateChatbot(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  const chatbot = await chatbotService.createChatbot(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Chatbot created successfully', chatbot });
}));

router.get('/', asyncHandler(async (req, res) => {
  const chatbots = await chatbotService.listChatbots(req.user._id);
  res.json({ success: true, chatbots });
}));

router.get('/:id', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  res.json({ success: true, chatbot: req.chatbot });
}));

router.put('/:id', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  const merged = { ...req.chatbot.toObject(), ...req.body, name: req.body.name ?? req.chatbot.name };
  const errors = validationService.validateChatbot(merged);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  const chatbot = await chatbotService.updateConfig(req.user._id, req.chatbot._id, req.body);
  res.json({ success: true, message: 'Chatbot updated successfully', chatbot });
}));

router.delete('/:id', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  await chatbotService.deleteChatbot(req.user._id, req.chatbot._id);
  res.json({ success: true, message: 'Chatbot deleted successfully' });
}));

router.get('/:id/key', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  const deploymentKey = await chatbotService.generateDeploymentKey(req.user._id, req.chatbot._id);
  res.json({ success: true, deploymentKey });
}));

router.post('/:id/test', ensureChatbotOwnership, asyncHandler(async (req, res) => {
  const results = await chatbotService.testIntegrations(req.user._id, req.chatbot._id);
  res.json({ success: true, results });
}));

export { ensureChatbotOwnership };
export default router;
