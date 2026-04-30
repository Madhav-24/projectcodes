// Module: Error Handler
// Purpose: Centralize backend error responses and logging.
import { sendError } from '../utils/apiResponse.js';

export default function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) {
    console.error('Unhandled server error', {
      path: req.originalUrl,
      method: req.method,
      message: error.message,
      stack: error.stack,
    });
  }

  return sendError(
    res,
    error.message || 'Internal server error',
    error.details || (isServerError ? null : error),
    statusCode
  );
}
