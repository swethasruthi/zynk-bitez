import express from 'express';
import { verifyToken, extractToken, JwtPayload } from '../utils/jwt.js';

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Authentication middleware: Verify JWT token from Authorization header
export const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    // Verify token and attach user data to request
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error: any) {
    // Handle token expiration or invalid signature
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authenticateToken = authenticate;
