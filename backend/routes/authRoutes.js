// Module: Auth Routes
// Purpose: Map authentication endpoints to controller handlers.
import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import authMiddleware, { attachProfile } from '../middlewares/authMiddleware.js';
import validateRequest from '../middlewares/validateRequest.js';

export default function createAuthRoutes({ authController, userRepository }) {
  const router = Router();
  const profileMiddleware = userRepository ? attachProfile(userRepository) : (_r, _s, n) => n();

  router.post('/login',
    validateRequest(['identifier', 'password']),
    asyncHandler(authController.login),
  );

  router.post('/register',
    validateRequest(['name', 'email', 'password', 'role']),
    asyncHandler(authController.register),
  );

  router.get('/me',
    authMiddleware,
    profileMiddleware,
    asyncHandler(authController.me),
  );

  router.post('/change-password',
    authMiddleware,
    validateRequest(['currentPassword', 'newPassword']),
    asyncHandler(authController.changePassword),
  );

  return router;
}
