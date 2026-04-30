// Module: Auth Middleware
// Purpose: Verify JWT bearer tokens and attach the decoded user to req.user.
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError.js';

export default function authMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization || '';
  const [authType, token] = authorizationHeader.split(' ');

  if (authType !== 'Bearer' || !token) {
    return next(new AppError('Unauthorized access.', 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // req.user carries the lightweight JWT claims
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

// Middleware that enriches req.userProfile with the full DB row (used by
// controllers that need assignedSite, permissions, name, etc.).
export function attachProfile(userRepository) {
  return async function (req, res, next) {
    try {
      if (req.user?.id) {
        req.userProfile = await userRepository.findById(req.user.id);
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

// Inline role guard factory — use after authMiddleware.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new AppError('Forbidden — insufficient role.', 403));
    }
    return next();
  };
}
