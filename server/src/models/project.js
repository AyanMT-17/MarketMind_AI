import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  targetAudience: {
    type: String,
    trim: true,
    default: ''
  },
  competitors: {
    type: [String],
    default: []
  },
  coreFeatures: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

ProjectSchema.index({ userId: 1, updatedAt: -1 });

export const Project = mongoose.model('Project', ProjectSchema);
