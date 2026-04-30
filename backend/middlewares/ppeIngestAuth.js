// Module: PPE Ingest Auth Middleware
// Purpose: Protect machine-to-machine PPE ingestion endpoint using a shared secret header.
import AppError from '../utils/AppError.js';

export default function ppeIngestAuth(req, _res, next) {
  const expectedKey = process.env.PPE_INGEST_KEY;
  if (!expectedKey) {
    return next(new AppError('PPE_INGEST_KEY is not configured on server.', 500));
  }

  const receivedKey = req.headers['x-ppe-ingest-key'];
  if (!receivedKey || receivedKey !== expectedKey) {
    return next(new AppError('Unauthorized PPE ingest request.', 401));
  }

  return next();
}