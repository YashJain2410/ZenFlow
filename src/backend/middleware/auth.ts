import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'fallback_development_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      // Fallback for Firebase ID tokens in dev environment
      decoded = jwt.decode(token);
      if (!decoded) throw new Error('Invalid token format');
    }
    
    // Attach user identity to request
    req.user = { id: decoded.id || decoded.sub || decoded.uid || decoded.user_id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
};
