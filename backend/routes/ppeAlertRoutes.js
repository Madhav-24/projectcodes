// Module: PPE Alert Routes
// Purpose: Receive PPE violations from the PPE engine and persist them to PostgreSQL.
import { Router } from 'express';
import asyncHandler from '../middlewares/asyncHandler.js';
import ppeIngestAuth from '../middlewares/ppeIngestAuth.js';

export default function createPpeAlertRoutes({ alertController }) {
  const router = Router();

  router.post('/',
    ppeIngestAuth,
    asyncHandler(alertController.createPpeAlert),
  );

  return router;
}