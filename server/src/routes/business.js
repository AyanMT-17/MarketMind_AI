import express from 'express';
import { businessMetricsService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();
router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const metrics = await businessMetricsService.createMetrics(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Business metrics created successfully', metrics });
}));

router.get('/', asyncHandler(async (req, res) => {
  const metrics = await businessMetricsService.listMetrics(req.user._id);
  res.json({ success: true, metrics });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const metrics = await businessMetricsService.getMetrics(req.user._id, req.params.id);
  if (!metrics) {
    return res.status(404).json({ success: false, message: 'Business metrics not found' });
  }
  res.json({ success: true, metrics });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const metrics = await businessMetricsService.updateMetrics(req.user._id, req.params.id, req.body);
  if (!metrics) {
    return res.status(404).json({ success: false, message: 'Business metrics not found' });
  }
  res.json({ success: true, message: 'Business metrics updated successfully', metrics });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await businessMetricsService.deleteMetrics(req.user._id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Business metrics not found' });
  }
  res.json({ success: true, message: 'Business metrics deleted successfully' });
}));

export default router;
