import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './models/database.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/project.js';
import strategyRoutes from './routes/strategy.js';

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

export const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);
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
  app.use('/api/projects', projectRoutes);
  app.use('/api/projects', strategyRoutes);

  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  });

  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  });

  return app;
};

export const startServer = async () => {
  await connectDB();
  const app = createApp();
  const port = process.env.PORT || 5000;

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/api/health`);
      resolve(server);
    });
  });
};
