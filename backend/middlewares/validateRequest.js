// Module: Validate Request
// Purpose: Enforce payload validation for mutable endpoints.
import AppError from '../utils/AppError.js';

export default function validateRequest(requiredFields = []) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body || req.body[field] === undefined || req.body[field] === null || req.body[field] === '');

    if (missingFields.length > 0) {
      return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    return next();
  };
}
