const { ValidationError } = require('../errors');

const validateProductCreation = (req, res, next) => {
  const { sku, description, purchasePrice, salePrice } = req.body;
  
  const errors = [];
  
  if (!sku || typeof sku !== 'string' || sku.trim() === '') {
    errors.push({ field: 'sku', message: 'SKU is required and must be a non-empty string' });
  }
  
  if (!description || typeof description !== 'string' || description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required and must be a non-empty string' });
  }
  
  if (purchasePrice === undefined || purchasePrice === null || typeof purchasePrice !== 'number' || purchasePrice < 0) {
    errors.push({ field: 'purchasePrice', message: 'Purchase price is required and must be a non-negative number' });
  }
  
  if (salePrice === undefined || salePrice === null || typeof salePrice !== 'number' || salePrice < 0) {
    errors.push({ field: 'salePrice', message: 'Sale price is required and must be a non-negative number' });
  }
  
  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }
  
  next();
};

const validateShipmentCreation = (req, res, next) => {
  const { supplierName, arrivalDate, items } = req.body;
  
  const errors = [];
  
  if (!supplierName || typeof supplierName !== 'string' || supplierName.trim() === '') {
    errors.push({ field: 'supplierName', message: 'Supplier name is required' });
  }
  
  if (!arrivalDate) {
    errors.push({ field: 'arrivalDate', message: 'Arrival date is required' });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    items.forEach((item, index) => {
      if (!item.sku) {
        errors.push({ field: `items[${index}].sku`, message: 'SKU is required for each item' });
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be greater than 0' });
      }
    });
  }
  
  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }
  
  next();
};


const validateOrderCreation = (req, res, next) => {
  const { customerName, orderDate, items } = req.body;
  
  const errors = [];
  
  if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
    errors.push({ field: 'customerName', message: 'Customer name is required' });
  }
  
  if (!orderDate) {
    errors.push({ field: 'orderDate', message: 'Order date is required' });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  } else {
    items.forEach((item, index) => {
      if (!item.sku) {
        errors.push({ field: `items[${index}].sku`, message: 'SKU is required for each item' });
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push({ field: `items[${index}].quantity`, message: 'Quantity must be greater than 0' });
      }
    });
  }
  
  if (errors.length > 0) {
    return next(new ValidationError('Validation failed', errors));
  }
  
  next();
};

const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new ValidationError('Date range required', [
      { field: 'startDate', message: 'Start date is required' },
      { field: 'endDate', message: 'End date is required' }
    ]));
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new ValidationError('Invalid date format', [
      { field: 'startDate', message: 'Invalid date format' },
      { field: 'endDate', message: 'Invalid date format' }
    ]));
  }
  
  if (start > end) {
    return next(new ValidationError('Invalid date range', [
      { field: 'dateRange', message: 'Start date must be before end date' }
    ]));
  }
  
  next();
};

module.exports = {
  validateProductCreation,
  validateShipmentCreation,
  validateOrderCreation,
  validateDateRange
};
