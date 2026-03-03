import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB, User, Campaign, Lead } from './database.js';
import { authService, aiService, validationService, emailService } from './services.js';

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;


// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', process.env.CLIENT_URL], // Vite default port + fallback
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting - General API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI generation rate limiter (expensive operations)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 AI requests per minute
  message: {
    success: false,
    message: 'Too many AI generation requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

app.use(express.json({ limit: '10mb' }));
// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.send('Welcome to MarketMind AI Server');
});

// Authentication Routes (with stricter rate limiting)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    console.log('Incoming Register Request:', req.body);
    const { email, password, firstName, lastName, company } = req.body;

    // Validate input
    const errors = validationService.validateUser(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      password,
      profile: { firstName, lastName, company }
    });

    await user.save();

    // Generate token
    const token = authService.generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate token
    const token = authService.generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Protected Routes
app.get('/api/auth/profile', authService.authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON()
  });
});

app.put('/api/auth/profile', authService.authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

// AI Content Generation (with AI rate limiting)
app.post('/api/ai/generate', aiLimiter, authService.authenticate, async (req, res) => {
  try {
    console.log('AI Generation Request:', req.body);
    const { prompt, contentType } = req.body;
    const brandSettings = req.user.brandSettings;

    const result = await aiService.generateContent(prompt, contentType, brandSettings);
    console.log('AI Generation Result:', result);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Campaign Management (Basic CRUD)
app.get('/api/campaigns', authService.authenticate, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns' });
  }
});

app.post('/api/campaigns', authService.authenticate, async (req, res) => {
  try {
    const campaignData = { ...req.body, userId: req.user._id };

    const errors = validationService.validateCampaign(campaignData);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Create campaign

    const result = await aiService.generateCampaign(campaignData);
    console.log('Campaign generation result:', result);
    res.json({
      success: true,
      message: 'Campaign created successfully',
      campaign: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// Sales Forecasting (with AI rate limiting)
app.post('/api/forecast', aiLimiter, authService.authenticate, async (req, res) => {
  try {
    const { salesData, context } = req.body;
    const forecast = await aiService.generateSalesForecast(salesData, context);

    res.json({
      success: true,
      ...forecast
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/campaigns/:id/send', authService.authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { recipients } = req.body;

    // Find the campaign
    const campaign = await Campaign.findOne({ _id: id, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Validate campaign content
    const contentErrors = emailService.validateEmailContent(campaign);
    if (contentErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Campaign content validation failed',
        errors: contentErrors
      });
    }

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and cannot be empty'
      });
    }

    // Send the campaign
    const result = await emailService.sendCampaign(campaign, recipients);

    // Update campaign status
    campaign.status = 'active';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign sent successfully',
      ...result
    });

  } catch (error) {
    console.error('Campaign send error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send campaign'
    });
  }
});


// Test different models endpoint
app.get('/api/test-models', authService.authenticate, async (req, res) => {
  try {
    const results = await aiService.testModels();
    res.json({
      success: true,
      message: 'Model testing completed',
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Model testing failed',
      error: error.message
    });
  }
});


// Lead Management CRUD Routes
app.get('/api/leads', authService.authenticate, async (req, res) => {
  try {
    const { stage, search } = req.query;
    let query = { userId: req.user._id };

    // Filter by pipeline stage if provided
    if (stage && stage !== 'all') {
      query.pipelineStage = stage;
    }

    let leads = await Lead.find(query).sort({ createdAt: -1 });

    // Search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      leads = leads.filter(lead =>
        lead.contactInfo.firstName.toLowerCase().includes(searchLower) ||
        lead.contactInfo.lastName.toLowerCase().includes(searchLower) ||
        lead.contactInfo.email.toLowerCase().includes(searchLower) ||
        (lead.contactInfo.company && lead.contactInfo.company.toLowerCase().includes(searchLower))
      );
    }

    res.json({ success: true, leads });
  } catch (error) {
    console.error('Fetch leads error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

app.get('/api/leads/:id', authService.authenticate, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, lead });
  } catch (error) {
    console.error('Fetch lead error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lead' });
  }
});

app.post('/api/leads', authService.authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, company, phone, pipelineStage, dealValue, probability, notes } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    const lead = new Lead({
      userId: req.user._id,
      contactInfo: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        company: company?.trim() || '',
        phone: phone?.trim() || ''
      },
      pipelineStage: pipelineStage || 'new',
      dealValue: dealValue || 0,
      probability: probability || 10,
      notes: notes || []
    });

    await lead.save();

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
});

app.put('/api/leads/:id', authService.authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, company, phone, pipelineStage, dealValue, probability, notes } = req.body;

    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Update fields
    if (firstName) lead.contactInfo.firstName = firstName.trim();
    if (lastName) lead.contactInfo.lastName = lastName.trim();
    if (email) lead.contactInfo.email = email.toLowerCase().trim();
    if (company !== undefined) lead.contactInfo.company = company?.trim() || '';
    if (phone !== undefined) lead.contactInfo.phone = phone?.trim() || '';
    if (pipelineStage) lead.pipelineStage = pipelineStage;
    if (dealValue !== undefined) lead.dealValue = dealValue;
    if (probability !== undefined) lead.probability = probability;
    if (notes) lead.notes = notes;

    lead.lastContact = new Date();

    await lead.save();

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead' });
  }
});

app.delete('/api/leads/:id', authService.authenticate, async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead' });
  }
});


// Error Handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 Handler
app.use('/*path', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});



// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
