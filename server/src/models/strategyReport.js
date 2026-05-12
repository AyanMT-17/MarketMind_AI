import mongoose from 'mongoose';

const StrategyReportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    enum: ['validation', 'launch-plan', 'competitor-analysis', '100-day-plan'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, {
  timestamps: true
});

StrategyReportSchema.index({ projectId: 1, type: 1 });

export const StrategyReport = mongoose.model('StrategyReport', StrategyReportSchema);
