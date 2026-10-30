import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './backend/routes/auth.js';
import workspaceRoutes from './backend/routes/workspace.js';
import scienceRoutes from './backend/routes/science.js';
import videoRoutes from './backend/routes/video.js';
import { initDatabase } from './backend/db.js';

dotenv.config();

const app = express();
// AI Studio dev server environment strictly requires port 3000.
// Cloud Run in production may use process.env.PORT, but local/dev must always listen on 3000.
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
// Also alias /workspace and /api/workspaces for direct REST client convenience
app.use('/api/workspaces', workspaceRoutes);
app.use('/workspace', workspaceRoutes);
app.use('/api/science', scienceRoutes);
app.use('/api/video', videoRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'OmniLearn - Multimodal Study Assistant',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    // Non-blocking database initialization
    initDatabase().catch((err) => {
      console.warn('[OmniLearn DB] Init warning:', err);
    });

    if (!isProduction) {
      // Mount Vite dev server middleware
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      // Production static serving
      const distPath = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`[OmniLearn Server] Running at http://0.0.0.0:${PORT}`);
    });

    server.on('error', (err: any) => {
      console.error('[OmniLearn Server] Listen error:', err);
    });
  } catch (err) {
    console.error('[OmniLearn Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();

