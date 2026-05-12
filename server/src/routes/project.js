import express from 'express';
import { projectService } from '../services/index.js';
import { authService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();

router.use(authService.authenticate);

router.post('/', asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.description) {
    return res.status(400).json({ success: false, message: 'Name and description are required' });
  }
  const project = await projectService.createProject(req.user._id, req.body);
  res.status(201).json({ success: true, project });
}));

router.get('/', asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user._id);
  res.json({ success: true, projects });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.user._id, req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, project });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user._id, req.params.id, req.body);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, project });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const success = await projectService.deleteProject(req.user._id, req.params.id);
  if (!success) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, message: 'Project deleted' });
}));

router.get('/:id/reports', asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.user._id, req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  
  const reports = await projectService.getReports(req.params.id);
  res.json({ success: true, reports });
}));

export default router;
