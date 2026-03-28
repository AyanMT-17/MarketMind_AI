import express from 'express';
import { emailSettingsService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();
router.use(authService.authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const settings = await emailSettingsService.getSettings(req.user._id);
  res.json({ success: true, settings: emailSettingsService.sanitizeForClient(settings) });
}));

router.put('/', asyncHandler(async (req, res) => {
  const settings = await emailSettingsService.updateSettings(req.user._id, req.body || {});
  res.json({ success: true, message: 'Email settings updated successfully', settings: emailSettingsService.sanitizeForClient(settings) });
}));

router.post('/test', asyncHandler(async (req, res) => {
  const result = await emailSettingsService.testSettings(req.user._id);
  res.json({ success: result.success, message: result.message });
}));

export default router;
