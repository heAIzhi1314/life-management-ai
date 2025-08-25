/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js'
import recordsRoutes from './routes/records.js'
import remindersRoutes from './routes/reminders.js'
import plansRoutes from './routes/plans.js'
import aiRoutes from './routes/ai.js'
import healthRoutes from './routes/health.js'
import keywordsRoutes from './routes/keywords.js'
import conversationsRoutes from './routes/conversations.js'
import memoriesRoutes from './routes/memories.js'
import dataQueryRoutes from './routes/data-query.js'
import insightsRoutes from './routes/insights.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/records', recordsRoutes)
app.use('/api/reminders', remindersRoutes)
app.use('/api/plans', plansRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/keywords', keywordsRoutes)
app.use('/api/conversations', conversationsRoutes)
app.use('/api/memories', memoriesRoutes)
app.use('/api/data-query', dataQueryRoutes)
app.use('/api/insights', insightsRoutes)

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;