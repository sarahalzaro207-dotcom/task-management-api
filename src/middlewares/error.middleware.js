// Handles requests to URLs that do not exist
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Central error handler. It must have 4 arguments so Express treats it as an error handler.
function errorHandler(err, req, res, next) {
  // Malformed JSON in the request body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  if (status >= 500) {
    console.error(err);
  }

  // Never leak internal details (stack traces, file paths) in production
  const message =
    status >= 500 && isProduction ? 'Internal server error' : err.message || 'Internal server error';

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };