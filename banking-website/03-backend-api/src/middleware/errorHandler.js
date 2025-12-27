// Centralized error handler to keep API responses predictable.
// In later lessons you can expand this to log to a file or tracking service.
// Small helper to make unique-ish identifiers without external packages.
const createRequestId = () => `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

function errorHandler(err, req, res, _next) {
  // Reuse an incoming request id if present, otherwise generate one.
  const requestId = req.requestId || req.headers['x-request-id'] || createRequestId();
  req.requestId = requestId;

  // Default values keep the response helpful even for unexpected errors.
  const status = err.status || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Something went wrong.';

  // Log to the console so beginners can see the stack during development.
  // eslint-disable-next-line no-console
  console.error(`[${requestId}]`, err);

  res.status(status).json({
    errorCode,
    message,
    requestId
  });
}

module.exports = {
  errorHandler,
  createRequestId
};
