import express from 'express';
import { adCampaignService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();
router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  const campaign = await adCampaignService.createCampaign(req.user._id, req.body);
  res.status(201).json({ success: true, message: 'Campaign created successfully', campaign });
}));

router.get('/', asyncHandler(async (req, res) => {
  const campaigns = await adCampaignService.listCampaigns(req.user._id);
  res.json({ success: true, campaigns });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const campaign = await adCampaignService.getCampaign(req.user._id, req.params.id);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }
  res.json({ success: true, campaign });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const campaign = await adCampaignService.updateCampaign(req.user._id, req.params.id, req.body);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }
  res.json({ success: true, message: 'Campaign updated successfully', campaign });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await adCampaignService.deleteCampaign(req.user._id, req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }
  res.json({ success: true, message: 'Campaign deleted successfully' });
}));

router.patch('/:id/performance', asyncHandler(async (req, res) => {
  const campaign = await adCampaignService.updatePerformance(req.params.id, req.body);
  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaign not found' });
  }

  res.json({ success: true, message: 'Campaign performance updated', campaign });
}));

export default router;
