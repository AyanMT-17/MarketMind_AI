import mongoose from 'mongoose';
import { User } from './user.js';
import { Project } from './project.js';
import { StrategyReport } from './strategyReport.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export { User, Project, StrategyReport };
