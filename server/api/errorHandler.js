/**
 * The final error handler for api call
 * @param {Error} error the error from prev middleware
 * @param req
 * @param res
 * @param next
 */
import logger from '../util/log';

export default function (error, req, res, next) {
  if (!error.statusCode) {
    logger.error(error.stack);
  }
  const statusCode = error.statusCode || 500;
  const payload = statusCode === 500 ? 'Internal server error' : error.errors || error.message || 'Internal server error';
  if (typeof payload === 'string') {
    res.status(statusCode).send(payload);
  } else {
    res.status(statusCode).json({
      success: false,
      errors: payload
    });
  }
}
