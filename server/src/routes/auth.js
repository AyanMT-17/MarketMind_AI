import express from 'express';
import { User } from '../models/database.js';
import { authService, validationService } from '../services/index.js';
import { asyncHandler } from './utils.js';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, company } = req.body;
  const errors = validationService.validateUser(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  const user = new User({
    email,
    password,
    profile: {
      firstName,
      lastName,
      company: company || ''
    }
  });

  await user.save();

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    token: authService.generateToken(user._id),
    user: user.toJSON()
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  return res.json({
    success: true,
    message: 'Login successful',
    token: authService.generateToken(user._id),
    user: user.toJSON()
  });
}));

router.get('/profile', authService.authenticate, (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

router.put('/profile', authService.authenticate, asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.email) {
    updates.email = req.body.email;
  }

  if (req.body.profile || req.body.firstName || req.body.lastName || req.body.company) {
    updates.profile = {
      firstName: req.body.profile?.firstName ?? req.body.firstName ?? req.user.profile.firstName,
      lastName: req.body.profile?.lastName ?? req.body.lastName ?? req.user.profile.lastName,
      company: req.body.profile?.company ?? req.body.company ?? req.user.profile.company,
      avatar: req.body.profile?.avatar ?? req.user.profile.avatar
    };
  }

  if (req.body.subscription) {
    updates.subscription = {
      ...req.user.subscription.toObject(),
      ...req.body.subscription
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, message: 'Profile updated', user: user.toJSON() });
}));

if (process.env.NODE_ENV !== 'production') {
  router.post('/dev/create-test-user', asyncHandler(async (req, res) => {
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (testUser) {
      return res.json({ success: true, message: 'Test user already exists', email: 'test@example.com', password: 'password123' });
    }

    testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      profile: { firstName: 'Test', lastName: 'User', company: 'Test Company' }
    });
    await testUser.save();

    res.json({ success: true, message: 'Test user created successfully', email: 'test@example.com', password: 'password123', note: 'Use these credentials to log in. This endpoint is for development only.' });
  }));
}

export default router;
