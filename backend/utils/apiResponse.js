// Module: API Response
// Purpose: Standardize all API response payloads.
export function sendSuccess(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, message, error = null, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
}
