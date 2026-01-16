import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

// Middleware to require authentication
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.session?.userId;

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true, email: true, name: true, role: true, approved: true },
    });

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'USER' | 'ADMIN',
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}
