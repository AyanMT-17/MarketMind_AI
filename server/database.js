import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const UserApiKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

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
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    avatar: { type: String, trim: true, default: '' }
  },
  apiKeys: {
    type: [UserApiKeySchema],
    default: []
  },
  subscription: {
    plan: { type: String, default: 'free' },
    status: { type: String, default: 'active' },
    limit: { type: Number, default: 1000 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

UserSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toJSON = function toJSON() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const ChatbotIntegrationRefSchema = new mongoose.Schema({
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'APIIntegration'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['rest_api', 'webhook'],
    required: true
  }
}, { _id: false });

const ChatbotSchema = new mongoose.Schema({
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
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive'],
    default: 'draft'
  },
  config: {
    systemPrompt: { type: String, trim: true, default: 'You are a helpful AI assistant.' },
    temperature: { type: Number, min: 0, max: 2, default: 0.7 },
    maxTokens: { type: Number, min: 1, max: 8192, default: 1024 },
    model: { type: String, trim: true, default: 'llama-3.3-70b-versatile' },
    welcomeMessage: { type: String, trim: true, default: 'Hello. How can I help you today?' }
  },
  businessProfile: {
    businessName: { type: String, trim: true, default: '' },
    industry: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    targetAudience: { type: String, trim: true, default: '' },
    valueProposition: { type: String, trim: true, default: '' },
    goals: {
      type: [String],
      default: []
    },
    offerings: {
      type: [String],
      default: []
    },
    supportChannels: {
      type: [String],
      default: []
    },
    knowledgeBaseUrls: {
      type: [String],
      default: []
    }
  },
  automation: {
    leadCaptureEnabled: { type: Boolean, default: true },
    leadCaptureFields: {
      type: [String],
      default: ['name', 'email', 'company']
    },
    primaryCallToAction: { type: String, trim: true, default: 'Book a demo' },
    bookingUrl: { type: String, trim: true, default: '' },
    escalationEnabled: { type: Boolean, default: true },
    escalationMessage: {
      type: String,
      trim: true,
      default: 'I can connect you with a human teammate if you would like follow-up support.'
    },
    escalationKeywords: {
      type: [String],
      default: ['pricing', 'demo', 'contract', 'sales', 'human', 'agent', 'support']
    }
  },
  settings: {
    allowedOrigins: {
      type: [String],
      default: []
    },
    requireAuth: {
      type: Boolean,
      default: true
    },
    rateLimit: {
      requests: { type: Number, default: 60 },
      window: { type: Number, default: 15 * 60 * 1000 }
    }
  },
  integrations: {
    type: [ChatbotIntegrationRefSchema],
    default: []
  },
  deploymentKey: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

ChatbotSchema.index({ userId: 1, updatedAt: -1 });
const ConversationMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['system', 'user', 'assistant', 'tool'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    trim: true,
    default: 'New Conversation'
  },
  messages: {
    type: [ConversationMessageSchema],
    default: []
  },
  metadata: {
    apiCallsMade: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now },
    leadCaptured: { type: Boolean, default: false },
    lead: {
      name: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      company: { type: String, trim: true, default: '' }
    },
    escalated: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

ConversationSchema.index({ chatbotId: 1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, updatedAt: -1 });

const APIIntegrationEndpointSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    trim: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    default: 'GET'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  authentication: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const APIIntegrationSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['rest_api', 'webhook'],
    required: true
  },
  config: {
    baseUrl: { type: String, required: true, trim: true },
    authType: { type: String, trim: true, default: 'none' },
    authToken: { type: String, trim: true, default: '' },
    headers: {
      type: Map,
      of: String,
      default: {}
    },
    endpoints: {
      type: [APIIntegrationEndpointSchema],
      default: []
    }
  },
  testResult: {
    success: { type: Boolean, default: false },
    error: { type: String, default: '' },
    response: { type: mongoose.Schema.Types.Mixed, default: null },
    testedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

APIIntegrationSchema.index({ chatbotId: 1, createdAt: -1 });

const TopQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  count: {
    type: Number,
    default: 1
  }
}, { _id: false });

const AnalyticsSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  stats: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalTokensUsed: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    apiCallsMade: { type: Number, default: 0 },
    leadsCaptured: { type: Number, default: 0 },
    escalationsTriggered: { type: Number, default: 0 }
  },
  topQuestions: {
    type: [TopQuestionSchema],
    default: []
  }
}, {
  timestamps: true
});

AnalyticsSchema.index({ chatbotId: 1, date: -1 });

// Ad Campaign Schema
const AdCampaignSchema = new mongoose.Schema({
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
    trim: true,
    default: ''
  },
  platform: {
    type: String,
    enum: ['facebook', 'google', 'instagram', 'linkedin', 'tiktok', 'twitter'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  dailyBudget: {
    type: Number,
    min: 0,
    default: 0
  },
  targetAudience: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 65 }
    },
    gender: { type: String, enum: ['all', 'male', 'female'], default: 'all' },
    interests: { type: [String], default: [] },
    demographics: { type: [String], default: [] },
    locations: { type: [String], default: [] }
  },
  adContent: {
    headline: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    primaryImage: { type: String, trim: true, default: '' },
    callToAction: { type: String, trim: true, default: 'Learn More' },
    landingUrl: { type: String, trim: true, required: true }
  },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysOfWeek: { type: [String], default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
    timeSlots: { type: [String], default: [] }
  },
  performance: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpa: { type: Number, default: 0 },
    roi: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

AdCampaignSchema.index({ userId: 1, updatedAt: -1 });

// Business Metrics Schema (Quarterly Sales & Profits)
const BusinessMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  metrics: {
    type: [{
      quarter: { type: String, required: true, trim: true },
      year: { type: Number, required: true },
      revenue: { type: Number, required: true, min: 0 },
      profit: { type: Number, required: true },
      expenses: { type: Number, min: 0, default: 0 },
      productsSold: { type: Number, default: 0 },
      customers: { type: Number, default: 0 }
    }],
    default: []
  },
  csvSource: {
    filename: { type: String, trim: true, default: '' },
    uploadedAt: { type: Date, default: null },
    originalData: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

BusinessMetricsSchema.index({ userId: 1, createdAt: -1 });

// Business Prediction Schema
const PredictionDataPointSchema = new mongoose.Schema({
  period: { type: String, required: true },
  predictedRevenue: { type: Number, required: true },
  predictedProfit: { type: Number, required: true },
  confidenceScore: { type: Number, min: 0, max: 1, default: 0.8 },
  growthRate: { type: Number, default: 0 }
}, { _id: false });

const BusinessPredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessMetricsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessMetrics',
    required: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  userPrompt: {
    type: String,
    required: true,
    trim: true
  },
  predictionPeriod: {
    type: String,
    enum: ['next_quarter', 'next_2_quarters', 'next_year', 'next_2_years'],
    default: 'next_quarter'
  },
  predictions: {
    type: [PredictionDataPointSchema],
    default: []
  },
  analysis: {
    summary: { type: String, trim: true, default: '' },
    trends: { type: [String], default: [] },
    risks: { type: [String], default: [] },
    opportunities: { type: [String], default: [] },
    recommendations: { type: [String], default: [] }
  },
  modelMetadata: {
    modelType: { type: String, default: 'time-series-forecasting' },
    dataPointsUsed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

BusinessPredictionSchema.index({ userId: 1, createdAt: -1 });
BusinessPredictionSchema.index({ businessMetricsId: 1 });

export const User = mongoose.model('User', UserSchema);
export const Chatbot = mongoose.model('Chatbot', ChatbotSchema);
export const Conversation = mongoose.model('Conversation', ConversationSchema);
export const APIIntegration = mongoose.model('APIIntegration', APIIntegrationSchema);
export const Analytics = mongoose.model('Analytics', AnalyticsSchema);
export const AdCampaign = mongoose.model('AdCampaign', AdCampaignSchema);
export const BusinessMetrics = mongoose.model('BusinessMetrics', BusinessMetricsSchema);
export const BusinessPrediction = mongoose.model('BusinessPrediction', BusinessPredictionSchema);
