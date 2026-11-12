/**
 * Centralized Error Handling Architecture
 * Defines custom Application Errors and standard Express error middleware.
 */

class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Operational errors created deliberately by services or validators
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON payload in request body.',
      },
    });
  }

  // Handle MySQL errors gracefully without exposing internals
  if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED')) {
    console.error('Database Error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred. Please try again later.',
      },
    });
  }

  // Unhandled / Unexpected server error
  console.error('Unhandled Application Error:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
    },
  });
}

module.exports = {
  AppError,
  errorHandler,
};
