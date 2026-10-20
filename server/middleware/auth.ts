import { Request, Response, NextFunction } from 'express';
import { getDatabaseStatus, connectToDatabase } from '../db.ts';
import { verifyAuthToken } from '../utils/authTokens.ts';

// Extend Express Session data interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    department?: string;
    yearOfStudy?: number;
    studentId?: string;
  }
}

export function extractAndAttachAuth(req: Request) {
  // If session is already populated via session cookie, we're good
  if (req.session && req.session.userId) {
    return;
  }

  // Extract bearer token from Authorization header or custom header
  let rawToken: string | undefined = undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.slice(7).trim();
  } else if (req.headers['x-quizup-session']) {
    rawToken = String(req.headers['x-quizup-session']).trim();
  } else if (req.query && typeof req.query.token === 'string') {
    rawToken = req.query.token.trim();
  }

  if (rawToken) {
    const verified = verifyAuthToken(rawToken);
    if (verified && verified.userId) {
      if (!req.session) {
        req.session = {} as any;
      }
      req.session.userId = verified.userId;
      req.session.email = verified.email;
      req.session.name = verified.name;
      req.session.role = verified.role;
      req.session.status = verified.status;
      req.session.department = verified.department;
      req.session.yearOfStudy = verified.yearOfStudy;
      req.session.studentId = verified.studentId;
    }
  }
}

export async function ensureDbConnected(req: Request, res: Response, next: NextFunction) {
  try {
    const status = getDatabaseStatus();
    if (!status.isConnected) {
      if (process.env.MONGODB_URI) {
        await connectToDatabase();
      } else {
        return res.status(503).json({
          error: 'DATABASE_NOT_CONFIGURED',
          message: 'MongoDB Atlas is not configured. Please set MONGODB_URI in your environment.',
          status: 'disconnected',
        });
      }
    }
    next();
  } catch (err: any) {
    return res.status(503).json({
      error: 'DATABASE_CONNECTION_ERROR',
      message: 'Failed to connect to MongoDB Atlas database. Please verify your connection string and cluster network access.',
      detail: err.message,
      status: 'error',
    });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  extractAndAttachAuth(req);
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in to continue.',
    });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  extractAndAttachAuth(req);
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in as an administrator.',
    });
  }

  if (req.session.role !== 'admin') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Administrator privileges are required for this action.',
    });
  }

  next();
}

export function requireApprovedStudent(req: Request, res: Response, next: NextFunction) {
  extractAndAttachAuth(req);
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  // Admins can also inspect student views if needed, but if it is student:
  if (req.session.role === 'admin') {
    return next();
  }

  if (req.session.status === 'pending') {
    return res.status(403).json({
      error: 'ACCOUNT_PENDING',
      message: 'Your registration is currently pending administrator verification. You cannot take quizzes yet.',
      status: 'pending',
    });
  }

  if (req.session.status === 'rejected') {
    return res.status(403).json({
      error: 'ACCOUNT_REJECTED',
      message: 'Your account registration was rejected by an administrator.',
      status: 'rejected',
    });
  }

  if (req.session.status === 'suspended') {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      message: 'Your student account has been temporarily suspended by an administrator.',
      status: 'suspended',
    });
  }

  if (req.session.status !== 'approved') {
    return res.status(403).json({
      error: 'ACCOUNT_NOT_APPROVED',
      message: 'Your account is not approved to access this resource.',
      status: req.session.status,
    });
  }

  next();
}
