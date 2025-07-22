import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, User, Campaign, Lead } from './database.js';
import { authService, aiService, validationService } from './services.js';

// Load environment variables
dotenv.config();
console.log('HF_TOKEN loaded:', process.env.HF_TOKEN ? 'Yes' : 'No');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
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

app.post('/api/auth/login', async (req, res) => {
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

// AI Content Generation - This route exists but may not be working properly
app.post('/api/ai/generate', authService.authenticate, async (req, res) => {
  try {
    const { prompt, contentType } = req.body;
    const brandSettings = req.user.brandSettings;

    const result = await aiService.generateContent(prompt, contentType, brandSettings);

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

    const campaign = new Campaign(campaignData);
    await campaign.save();

    res.status(201).json({
      success: true,
      message: 'Campaign created',
      campaign
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create campaign' });
  }
});

// Sales Forecasting - This route exists
app.post('/api/forecast', authService.authenticate, async (req, res) => {
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
  // Campaign sending logic
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
  console.log('HF_TOKEN loaded:', process.env.HF_TOKEN ? 'Yes' : 'No');
});
