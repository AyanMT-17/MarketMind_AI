import jwt from 'jsonwebtoken';
import { User } from '../models/database.js';

export const utilityService = {
  formatResponse(success, data = null, message = '', errors = []) {
    const response = {
      success: Boolean(success),
      message: message || (success ? 'Operation completed successfully' : 'Operation failed'),
      timestamp: new Date().toISOString()
    };

    if (data !== null && data !== undefined) {
      response.data = data;
    }

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  },

  sanitizeString(value, maxLength = 5000) {
    if (typeof value !== 'string') {
      return '';
    }

    return value.trim().replace(/[<>]/g, '').slice(0, maxLength);
  }
};

export const validationService = {
  validateUser(userData) {
    const errors = [];

    if (!userData) {
      return ['User data is required'];
    }

    const email = userData.email?.trim();
    const password = userData.password || '';
    const firstName = userData.firstName?.trim();
    const lastName = userData.lastName?.trim();

    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Valid email address required');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (!firstName) {
      errors.push('First name is required');
    }

    if (!lastName) {
      errors.push('Last name is required');
    }

    return errors;
  }
};

export const authService = {
  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  },

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  async authenticate(req, res, next) {
    try {
      const authHeader = req.header('Authorization');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization header must start with Bearer' });
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = authService.verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Authentication failed' });
      }

      req.user = user;
      return next();
    } catch (error) {
      const message = error.name === 'TokenExpiredError' ? 'Token has expired' : 'Authentication failed';
      return res.status(401).json({ success: false, message });
    }
  }
};
