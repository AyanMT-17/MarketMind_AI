import express from 'express';
import { agentService, emailSettingsService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();
router.use(authService.authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const emailSettings = await emailSettingsService.getSettings(req.user._id);
  res.json({
    success: true,
    agents: agentService.getAgentCatalog(),
    emailSettings: emailSettingsService.sanitizeForClient(emailSettings)
  });
}));

router.get('/history', asyncHandler(async (req, res) => {
  const runs = await agentService.listRuns(req.user._id, {
    agentType: req.query.agentType || '',
    chatbotId: req.query.chatbotId || ''
  });

  res.json({ success: true, runs: runs.map((run) => agentService.buildRunResponse(run)) });
}));

router.post('/run', asyncHandler(async (req, res) => {
  const run = await agentService.runAgent(req.user._id, req.body || {});
  res.status(201).json({ success: true, run: agentService.buildRunResponse(run) });
}));

router.get('/runs/:id', asyncHandler(async (req, res) => {
  const run = await agentService.getRun(req.user._id, req.params.id);
  if (!run) {
    return res.status(404).json({ success: false, message: 'Agent run not found' });
  }

  res.json({ success: true, run: agentService.buildRunResponse(run) });
}));

router.post('/runs/:id/approve', asyncHandler(async (req, res) => {
  const run = await agentService.approveEmailRun(req.user._id, req.params.id);
  if (!run) {
    return res.status(404).json({ success: false, message: 'Agent run not found' });
  }

  res.json({ success: true, run: agentService.buildRunResponse(run) });
}));

export default router;
