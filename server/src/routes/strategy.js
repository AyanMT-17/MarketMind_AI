import express from 'express';
import { aiStrategyService, authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();

router.use(authService.authenticate);

router.post('/:id/generate/validation', asyncHandler(async (req, res) => {
  const report = await aiStrategyService.generateValidation(req.params.id, req.user._id);
  res.json({ success: true, report });
}));

router.post('/:id/generate/launch-plan', asyncHandler(async (req, res) => {
  const report = await aiStrategyService.generateLaunchPlan(req.params.id, req.user._id);
  res.json({ success: true, report });
}));

router.post('/:id/generate/competitor-analysis', asyncHandler(async (req, res) => {
  const { competitorUrl } = req.body;
  if (!competitorUrl) return res.status(400).json({ success: false, message: 'competitorUrl is required' });
  
  const report = await aiStrategyService.generateCompetitorAnalysis(req.params.id, req.user._id, competitorUrl);
  res.json({ success: true, report });
}));

router.post('/:id/generate/100-day-plan', asyncHandler(async (req, res) => {
  const report = await aiStrategyService.generate100DayPlan(req.params.id, req.user._id);
  res.json({ success: true, report });
}));

router.post('/:id/simulate-pitch', asyncHandler(async (req, res) => {
  const { messages } = req.body; // Array of { role, content }
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ success: false, message: 'messages array is required' });
  
  const responseMessage = await aiStrategyService.simulatePitchStream(req.params.id, req.user._id, messages);
  res.json({ success: true, message: responseMessage });
}));

export default router;
