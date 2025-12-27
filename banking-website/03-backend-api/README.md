// banking-website/03-backend-api/src/middleware/errorHandler.js
// Central error handler with a consistent response shape.
// Response format: { errorCode, message, requestId }

function randomId() {
  // Short request id for learning/demo purposes.
  // Example: REQ-A1B2C3
  return `REQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function errorHandler(err, req, res, next) {
  // If something already started sending a response, delegate to Express default handler
  if (res.headersSent) return next(err);

  const status = Number(err.status || err.statusCode || 500);

  // requestId may be set by earlier middleware. Fallback if not.
  const requestId =
    (req && (req.requestId || req.headers["x-request-id"])) || randomId();

  // Prefer explicit errorCode, otherwise map common cases, otherwise CONTACT_OFFICER for 500.
  const errorCode =
    err.errorCode ||
    (status === 401 ? "UNAUTHORIZED" : null) ||
    (status === 403 ? "FORBIDDEN" : null) ||
    (status === 404 ? "NOT_FOUND" : null) ||
    (status === 400 ? "VALIDATION_ERROR" : null) ||
    "CONTACT_OFFICER";

  const message =
    err.message ||
    (status >= 500
      ? "Something went wrong. Please contact your account officer."
      : "Request failed.");

  // Helpful server-side log for learning
  console.error("[API ERROR]", {
    status,
    errorCode,
    requestId,
    message,
    stack: err.stack,
  });

  res.status(status).json({ errorCode, message, requestId });
}

module.exports = { errorHandler };
