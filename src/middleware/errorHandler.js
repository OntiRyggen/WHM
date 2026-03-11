const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  
  const errorResponse = {
    error: err.name || 'Error',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (err.name === 'AuthenticationError' || err.name === 'TokenExpiredError' || err.name === 'InvalidTokenError') {
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'AuthorizationError') {
    errorResponse.requiredRole = err.requiredRole;
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'ValidationError') {
    errorResponse.fields = err.fields;
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'DuplicateSKUError') {
    errorResponse.sku = err.sku;
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'ProductNotFoundError') {
    errorResponse.sku = err.sku;
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'InsufficientStockError') {
    errorResponse.details = {
      sku: err.sku,
      requested: err.requested,
      available: err.available
    };
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'DatabaseConnectionError') {
    errorResponse.message = 'Database connection unavailable. Please try again later.';
    return res.status(statusCode).json(errorResponse);
  }

  if (err.name === 'ProductDeletionNotAllowedError' || err.name === 'ImmutableLogError') {
    return res.status(statusCode).json(errorResponse);
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
