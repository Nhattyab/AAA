import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { routes } from './server/routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize and seed relational SQLite database
  try {
    console.log('Initializing relational database database.sqlite...');
    await initDatabase();
    console.log('SQL DB seeded and connected successfully!');
  } catch (err) {
    console.error('Critical: DB initialization failed:', err);
  }

  // Parse JSON payloads & Cookies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount API Endpoints FIRST
  app.use(routes);

  // Health-check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  // Setup client-side frontend rendering layer
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting application in DEVELOPMENT mode (Vite Middleware)...');
    
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite for non-API routes in development
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API endpoints to avoid shadowing potential API errors with HTML responses
      if (url.startsWith('/api/')) {
        return next();
      }
      try {
        const htmlPath = path.join(process.cwd(), 'index.html');
        let html = await fs.promises.readFile(htmlPath, 'utf-8');
        html = await vite.transformIndexHtml(url, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        next(err);
      }
    });
  } else {
    console.log('Starting application in PRODUCTION mode (Static Serve)...');
    
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // In Express, route all other non-API routes directly to frontend SPA entry index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Store Management System running live at http://localhost:${PORT}`);
  });
}

startServer();
