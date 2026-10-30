import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'omnilearn_super_secret_jwt_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
  };
}

export function generateToken(payload: { userId: string; email: string; name?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Transparent guest demo session for frictionless evaluation
    req.user = {
      userId: 'user_demo_scholar',
      email: 'scholar@omnilearn.ai',
      name: 'Scholar Alex',
    };
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please sign in again.',
    });
  }
}

// Optional auth middleware for guest/demo operations
export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name?: string;
      };
      req.user = decoded;
    } catch {
      // ignore token verification error in optional auth
    }
  }
  next();
}
