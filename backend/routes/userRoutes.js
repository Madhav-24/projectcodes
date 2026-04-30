// Module: User Routes
// Purpose: Map user endpoints to controller handlers.
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import asyncHandler from '../middlewares/asyncHandler.js';

export default function createUserRoutes({ userController, profileMiddleware }) {
  const router = Router();

  router.get('/',
    authMiddleware,
    asyncHandler(userController.listUsers),
  );

  router.get('/:userId',
    authMiddleware,
    asyncHandler(userController.getUserById),
  );

  router.patch('/:userId/permissions',
    authMiddleware,
    asyncHandler(userController.updatePermissions),
  );

  return router;
}
