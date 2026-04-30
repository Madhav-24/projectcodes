// Module: Alert Routes
// Purpose: Map safety alert endpoints to controller handlers.
import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import validateRequest from '../middlewares/validateRequest.js';

export default function createAlertRoutes({ alertController }) {
  const router = Router();

  router.get('/', asyncHandler(alertController.getAlerts));

  router.post('/',
    validateRequest(['site', 'problem']),
    asyncHandler(alertController.createAlert),
  );

  return router;
}
