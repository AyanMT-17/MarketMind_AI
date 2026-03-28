import express from 'express';
import { businessPredictionService, chatbotService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();
router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const { businessMetricsId, userPrompt, predictionPeriod } = req.body;
  if (!businessMetricsId || !userPrompt) {
    return res.status(400).json({ success: false, message: 'Business metrics ID and user prompt are required' });
  }

  try {
    const prediction = await businessPredictionService.generatePrediction(req.user._id, businessMetricsId, { userPrompt, predictionPeriod: predictionPeriod || 'next_quarter' });
    if (!prediction) {
      return res.status(404).json({ success: false, message: 'Business metrics not found' });
    }

    res.status(201).json({ success: true, message: 'Prediction generated successfully', prediction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate prediction', error: error.message });
  }
}));

router.get('/', asyncHandler(async (req, res) => {
  const predictions = await businessPredictionService.listPredictions(req.user._id);
  res.json({ success: true, predictions });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const prediction = await businessPredictionService.getPrediction(req.user._id, req.params.id);
  if (!prediction) {
    return res.status(404).json({ success: false, message: 'Prediction not found' });
  }
  res.json({ success: true, prediction });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await businessPredictionService.deletePrediction(req.user._id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Prediction not found' });
  }
  res.json({ success: true, message: 'Prediction deleted successfully' });
}));

export default router;
