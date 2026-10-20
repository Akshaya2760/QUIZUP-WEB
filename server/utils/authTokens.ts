import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  department?: string;
  yearOfStudy?: number;
  studentId?: string;
  exp: number;
}

const SECRET = process.env.SESSION_SECRET || 'quizup-production-session-secret-984210';

export function createAuthToken(data: Omit<TokenPayload, 'exp'>): string {
  const payload: TokenPayload = {
    ...data,
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;
    const [body, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    if (signature !== expectedSig) return null;
    const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
