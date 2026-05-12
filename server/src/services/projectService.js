import { Project, StrategyReport } from '../models/database.js';

export const projectService = {
  async createProject(userId, payload) {
    const project = new Project({
      userId,
      name: (payload.name || '').toString().trim(),
      description: (payload.description || '').toString().trim(),
      targetAudience: (payload.targetAudience || '').toString().trim(),
      competitors: Array.isArray(payload.competitors) ? payload.competitors : [],
      coreFeatures: Array.isArray(payload.coreFeatures) ? payload.coreFeatures : []
    });

    await project.save();
    return project;
  },

  async listProjects(userId) {
    return Project.find({ userId }).sort({ updatedAt: -1 });
  },

  async getProject(userId, projectId) {
    return Project.findOne({ _id: projectId, userId });
  },

  async updateProject(userId, projectId, payload) {
    const project = await this.getProject(userId, projectId);
    if (!project) return null;

    if (payload.name !== undefined) project.name = (payload.name || '').toString().trim();
    if (payload.description !== undefined) project.description = (payload.description || '').toString().trim();
    if (payload.targetAudience !== undefined) project.targetAudience = (payload.targetAudience || '').toString().trim();
    if (payload.competitors !== undefined) project.competitors = payload.competitors;
    if (payload.coreFeatures !== undefined) project.coreFeatures = payload.coreFeatures;

    await project.save();
    return project;
  },

  async deleteProject(userId, projectId) {
    const project = await this.getProject(userId, projectId);
    if (!project) return false;

    await StrategyReport.deleteMany({ projectId: project._id });
    await project.deleteOne();
    return true;
  },

  async getReports(projectId) {
    return StrategyReport.find({ projectId }).sort({ createdAt: -1 });
  },

  async saveReport(projectId, type, data) {
    // Upsert so we only have one of each type per project (or we can just append, but upsert is usually better for this)
    return StrategyReport.findOneAndUpdate(
      { projectId, type },
      { data },
      { new: true, upsert: true }
    );
  }
};
