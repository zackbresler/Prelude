import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './lib/config.js';
import { prisma, disconnectPrisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Augment express-session types
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

const app = express();

// Trust proxy in production (required for secure cookies behind reverse proxy)
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json({ limit: '50mb' })); // Large limit for project data with images
app.use(cookieParser());

// CORS - only needed for development when client runs on different port
if (config.NODE_ENV === 'development') {
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));
}

// Determine cookie secure setting
const getCookieSecure = (): boolean => {
  if (config.COOKIE_SECURE === 'true') return true;
  if (config.COOKIE_SECURE === 'false') return false;
  // 'auto' - secure in production
  return config.NODE_ENV === 'production';
};

// Session configuration
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: getCookieSecure(),
    httpOnly: true,
    maxAge: config.SESSION_MAX_AGE,
    sameSite: 'lax',
  },
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (config.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));

  // SPA fallback - serve index.html for any non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectPrisma();
  process.exit(0);
});

// Start server
const PORT = parseInt(config.PORT, 10);

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║             Prelude Server                     ║
╠═══════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}             ║
║  Environment: ${config.NODE_ENV.padEnd(27)}║
║  Registration: ${config.ALLOW_REGISTRATION ? 'Enabled' : 'Disabled'}                       ║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;
