// Authentication Errors
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class TokenExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenExpiredError';
    this.statusCode = 401;
  }
}

class InvalidTokenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTokenError';
    this.statusCode = 401;
  }
}

// Authorization Errors
class AuthorizationError extends Error {
  constructor(message, requiredRole) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.requiredRole = requiredRole;
  }
}

// Validation Errors
class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.fields = fields;
  }
}

// Product Errors
class DuplicateSKUError extends Error {
  constructor(sku) {
    super(`Product with SKU '${sku}' already exists`);
    this.name = 'DuplicateSKUError';
    this.statusCode = 409;
    this.sku = sku;
  }
}

class ProductNotFoundError extends Error {
  constructor(sku) {
    super(`Product with SKU '${sku}' not found`);
    this.name = 'ProductNotFoundError';
    this.statusCode = 404;
    this.sku = sku;
  }
}

class ProductDeletionNotAllowedError extends Error {
  constructor() {
    super('Products cannot be deleted once created in the system');
    this.name = 'ProductDeletionNotAllowedError';
    this.statusCode = 403;
  }
}


// Inventory Errors
class InsufficientStockError extends Error {
  constructor(sku, requested, available) {
    super(`Insufficient stock for SKU '${sku}'. Requested: ${requested}, Available: ${available}`);
    this.name = 'InsufficientStockError';
    this.statusCode = 400;
    this.sku = sku;
    this.requested = requested;
    this.available = available;
  }
}

// Database Errors
class DatabaseConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.statusCode = 503;
  }
}

// Audit Errors
class ImmutableLogError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImmutableLogError';
    this.statusCode = 403;
  }
}

module.exports = {
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
  AuthorizationError,
  ValidationError,
  DuplicateSKUError,
  ProductNotFoundError,
  ProductDeletionNotAllowedError,
  InsufficientStockError,
  DatabaseConnectionError,
  ImmutableLogError
};
