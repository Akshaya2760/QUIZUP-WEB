import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRouter from './routes/auth.ts';
import adminRouter from './routes/admin.ts';
import quizzesRouter, { seedSampleQuizzesIfEmpty } from './routes/quizzes.ts';
import resultsRouter from './routes/results.ts';
import announcementsRouter from './routes/announcements.ts';
import aiRouter from './routes/ai.ts';
import healthRouter from './routes/health.ts';
import { connectToDatabase, getDatabaseStatus, getTargetDbName } from './db.ts';
import { extractAndAttachAuth } from './middleware/auth.ts';

dotenv.config();

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Configure Session Store
  const sessionSecret = process.env.SESSION_SECRET || 'quizup-production-session-secret-984210';
  const isSecureCookie = process.env.COOKIE_SECURE === 'true';

  let store: any = undefined;
  if (process.env.MONGODB_URI) {
    try {
      const dbName = getTargetDbName(process.env.MONGODB_URI);
      store = MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 days
        autoRemove: 'native',
      });
      if (store && typeof store.on === 'function') {
        store.on('error', (err: any) => {
          console.error('[Session Store Error]:', err?.message || err);
        });
      }
    } catch (e: any) {
      console.warn('[Session] Could not initialize MongoStore immediately:', e.message);
    }
  }

  app.use(
    session({
      name: 'quizup.sid',
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );
  // Extract bearer token / session header if present
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    extractAndAttachAuth(req);
    next();
  });

  // Mount API endpoints
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/quizzes', quizzesRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/announcements', announcementsRouter);
  app.use('/api/ai', aiRouter);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Error]:', err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(err.status || 500).json({
      error: 'SERVER_ERROR',
      message: err.message || 'An unexpected internal error occurred.',
    });
  });

  // Attempt initial database connection asynchronously
  if (process.env.MONGODB_URI) {
    connectToDatabase()
      .then(() => seedSampleQuizzesIfEmpty())
      .catch((err) => {
        console.warn('[Database] Initial connect failed, will retry on demand:', err.message);
      });
  }

  return app;
}
