import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Database Connection
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Error:', error.message);
    process.exit(1);
  }
};

// User Schema - Core authentication model
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    avatar: String
  },
  brandSettings: {
    tone: { type: String, default: 'professional' },
    style: { type: String, default: 'conversational' },
    guidelines: String,
    targetAudience: String
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' }
  },
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true 
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.model('User', UserSchema);

// Campaign Schema - Prepared for future expansion
const CampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['email', 'social', 'ad', 'blog'], required: true },
  status: { type: String, enum: ['draft', 'scheduled', 'active', 'completed'], default: 'draft' },
  content: {
    subject: String,
    body: String,
    variations: [String]
  },
  aiMetadata: {
    model: String,
    prompt: String,
    generatedAt: Date
  },
}, { 
  timestamps: true 
});

export const Campaign = mongoose.model('Campaign', CampaignSchema);

// Lead Schema - Sales pipeline management
const LeadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
    phone: String
  },
  pipelineStage: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
    default: 'new'
  },
  dealValue: { type: Number, default: 0 },
  probability: { type: Number, default: 10 },
  notes: [String],
  lastContact: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

export const Lead = mongoose.model('Lead', LeadSchema);
