import express from 'express';
import { integrationService, chatbotService, validationService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';
import { ensureChatbotOwnership } from './chatbot.js';

const router = express.Router();

router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const errors = validationService.validateIntegration(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  try {
    const integration = await integrationService.createIntegration(req.user._id, req.body);
    res.status(201).json({ success: true, message: 'Integration created successfully', integration });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const integrations = await integrationService.listIntegrations(req.user._id, req.query.chatbotId || null);
  res.json({ success: true, integrations });
}));

router.put('/:id', asyncHandler(async (req, res) => {
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
      headers: req.body.config?.headers ?? existing.config.headers,
      endpoints: req.body.config?.endpoints ?? existing.config.endpoints
    }
  };
  const errors = validationService.validateIntegration(mergedPayload);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  const integration = await integrationService.updateIntegration(req.user._id, req.params.id, req.body);
  res.json({ success: true, message: 'Integration updated successfully', integration });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await integrationService.deleteIntegration(req.user._id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Integration not found' });
  }

  res.json({ success: true, message: 'Integration deleted successfully' });
}));

router.post('/:id/test', asyncHandler(async (req, res) => {
  const result = await integrationService.testIntegration(req.user._id, req.params.id, req.body || {});
  if (!result) {
    return res.status(404).json({ success: false, message: 'Integration not found' });
  }

  res.json({ success: true, result });
}));

export default router;
