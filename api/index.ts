import express from 'express';
import cookieParser from 'cookie-parser';
import { initDatabase } from '../server/db.js';
import { routes } from '../server/routes.js';

const app = express();

// Track DB initialization to avoid redundant sync during the function's warm phase
let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    try {
      console.log('[Vercel Serverless] Launching SQLite database initialization...');
      await initDatabase();
      dbInitialized = true;
      console.log('[Vercel Serverless] SQLite database successfully connected and seeded.');
    } catch (err) {
      console.error('[Vercel Serverless] Failed to initialize SQLite database:', err);
    }
  }
}

// Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection middleware for Serverless invocations
app.use(async (req, res, next) => {
  await ensureDb();
  next();
});

// Mount Routes
app.use(routes);

// Simple test/health route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Store Management API is up and running on Vercel!',
    database: dbInitialized ? 'connected' : 'initializing/failed',
    timestamp: new Date().toISOString()
  });
});

export default app;
