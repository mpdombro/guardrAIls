import { auth } from 'express-oauth2-jwt-bearer';
import { Request, Response, NextFunction } from 'express';
import { auth0Config } from '../config/auth0.js';

// JWT validation middleware
export const checkJwt = auth({
  audience: auth0Config.audience,
  issuerBaseURL: `https://${auth0Config.domain}`,
  tokenSigningAlg: 'RS256',
});

// Required authentication middleware (rejects unauthenticated requests)
export const requireAuth = checkJwt;

// Optional authentication middleware (allows both authenticated and unauthenticated requests)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // If no authorization header, continue without authentication
  if (!req.headers.authorization) {
    return next();
  }

  // Otherwise, validate the token
  checkJwt(req, res, next);
};

// Middleware to extract user info from JWT
export const getUserInfo = (req: Request, _res: Response, next: NextFunction) => {
  // Auth payload is added by express-oauth2-jwt-bearer
  const auth = (req as any).auth;

  if (auth) {
    // Extract user information from the token
    req.user = {
      sub: auth.payload.sub,
      email: auth.payload.email || auth.payload['https://api.vibec0derzz.com/email'],
      name: auth.payload.name || auth.payload['https://api.vibec0derzz.com/name'],
      permissions: auth.payload.permissions || [],
      scope: auth.payload.scope || '',
    };
  }

  next();
};

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        name?: string;
        permissions: string[];
        scope: string;
      };
    }
  }
}
