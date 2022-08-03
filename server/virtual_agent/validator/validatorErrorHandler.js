import { validationResult } from 'express-validator';

export default function validatorErrorHandler(req, res, next) {
  // Finds the validation errors in this request
  // and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: Object.values(errors.mapped()),
    });
  }
  return next();
}
