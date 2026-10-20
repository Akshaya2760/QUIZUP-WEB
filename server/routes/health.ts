import { Router, Request, Response } from 'express';
import { getDatabaseStatus, connectToDatabase, sanitizeUri } from '../db.ts';
import { seedSampleQuizzesIfEmpty } from './quizzes.ts';

const router = Router();

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();

  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'QUIZUP College Quiz Platform',
    version: '1.0.0',
    database: {
      connected: dbStatus.isConnected,
      state: dbStatus.state,
      databaseName: dbStatus.dbName,
      uriConfigured: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== ''),
      sanitizedTarget: sanitizeUri(process.env.MONGODB_URI),
    },
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Explicit database reconnect trigger
router.post('/connect-db', async (req: Request, res: Response) => {
  try {
    const { mongoUri } = req.body;

    if (mongoUri && typeof mongoUri === 'string' && mongoUri.startsWith('mongodb')) {
      process.env.MONGODB_URI = mongoUri.trim();
    }

    if (!process.env.MONGODB_URI) {
      return res.status(400).json({
        error: 'NO_URI_PROVIDED',
        message: 'No MONGODB_URI provided in request or environment.',
      });
    }

    await connectToDatabase();
    await seedSampleQuizzesIfEmpty();

    const dbStatus = getDatabaseStatus();
    return res.json({
      message: 'Successfully connected to MongoDB Atlas (QUIZUP)!',
      database: dbStatus,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'CONNECTION_FAILED',
      message: err.message,
    });
  }
});

export default router;
