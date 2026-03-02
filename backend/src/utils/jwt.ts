import jwt from 'jsonwebtoken';

// Interface for JWT payload structure
export interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'chef' | 'delivery' | 'admin';
}

// Sign a new JWT token with user data
export const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'your_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  // Create JWT with user payload
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// Verify JWT token and return decoded payload
export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'your_secret_key';

  // Verify token signature and expiration
  return jwt.verify(token, secret) as JwtPayload;
};

// Extract token from Authorization header (Bearer schema)
export const extractToken = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};
