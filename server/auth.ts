import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserAttributes } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-store-manager-secret-key-991188';

// Custom request interface with authenticated user property
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Finance' | 'Seller';
  };
}

// Generate secure JWT token
export function generateToken(user: UserAttributes): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Secure cookie config
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// Middleware to authenticate JWT token from Cookies
export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: 'Access denied. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      name: string;
      email: string;
      role: 'Admin' | 'Finance' | 'Seller';
    };

    // Verify user exists and is active in database to protect against revoked users
    const dbUser = await User.findByPk(decoded.id);
    if (!dbUser || dbUser.status === 'inactive') {
      res.clearCookie('token');
      res.status(403).json({ error: 'Account has been deactivated or does not exist.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
    };
    
    next();
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

// Middleware to authorize specific roles
export function requireRole(allowedRoles: ('Admin' | 'Finance' | 'Seller')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden. This operation is limited to: ${allowedRoles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}
