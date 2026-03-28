import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { connectDB, User } from './models/database.js';
import { aiService, authService } from './services/index.js';
import authRoutes from './routes/auth.js';
import chatbotRoutes from './routes/chatbot.js';
import integrationRoutes from './routes/integration.js';
import chatRoutes from './routes/chat.js';
import agentsRoutes from './routes/agents.js';
import emailSettingsRoutes from './routes/emailSettings.js';
import campaignsRoutes from './routes/campaigns.js';
import businessRoutes from './routes/business.js';
import predictionsRoutes from './routes/predictions.js';

dotenv.config();

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];

const buildAllowedOrigins = () => [...new Set([...DEFAULT_ALLOWED_ORIGINS, process.env.CLIENT_URL].filter(Boolean))];

const buildGeneralLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});

const buildAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  }
});

const buildChatLimiter = () => rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?._id || ipKeyGenerator(req)}:${req.params.chatbotId}`,
  message: {
    success: false,
    message: 'Too many chatbot messages, please slow down.'
  }
});

const buildIntegrationLimiter = () => rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?._id || ipKeyGenerator(req)}:${req.params.id || req.body.chatbotId || 'integration'}`,
  message: {
    success: false,
    message: 'Too many integration requests, please try again later.'
  }
});

const resolveAuthenticatedUser = async (token) => {
  const decoded = authService.verifyToken(token);
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error('Authentication failed');
  }
  return user;
};

const configureSocketServer = (io) => {
  io.use(async (socket, next) => {
    try {
      const rawAuth = socket.handshake.auth?.token || socket.handshake.headers.authorization || '';
      const token = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7) : rawAuth;
      if (!token) {
        throw new Error('Authentication token is required');
      }
      socket.data.user = await resolveAuthenticatedUser(token);
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('send_message', async (payload = {}) => {
      try {
        const user = socket.data.user;
        const chatbot = await chatbotRoutes ? null : null; // placeholder since chat logic is route-based
        socket.emit('chat_error', { message: 'Socket chat endpoint requires dedicated integration' });
      } catch (error) {
        socket.emit('chat_error', { message: error.message || 'Socket chat failed' });
      }
    });
  });
};

export const createApp = () => {
  const app = express();
  const allowedOrigins = buildAllowedOrigins();

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use('/api', buildGeneralLimiter());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
  });

  app.get('/', (req, res) => {
    res.send('Welcome to MarketMind AI Server');
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/chatbots', chatbotRoutes);
  app.use('/api/integrations', integrationRoutes);
  app.use('/api', chatRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/email-settings', emailSettingsRoutes);
  app.use('/api/campaigns', campaignsRoutes);
  app.use('/api/business-metrics', businessRoutes);
  app.use('/api/predictions', predictionsRoutes);

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  return app;
};

export const createServer = () => {
  const app = createApp();
  const httpServer = http.createServer(app);
  const io = new SocketIOServer({
    cors: { origin: buildAllowedOrigins(), credentials: true }
  });

  configureSocketServer(io);
  io.attach(httpServer);
  return { app, io, httpServer };
};

export const startServer = async () => {
  await connectDB();
  const { httpServer } = createServer();
  const port = process.env.PORT || 5000;

  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/api/health`);
      resolve(httpServer);
    });
  });
};
