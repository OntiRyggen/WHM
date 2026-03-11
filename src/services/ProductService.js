const { createProduct, getProductBySKU, updateProduct, searchProducts, getAllProducts } = require('../models/Product');
const { query } = require('../db/connection');
const { AuditService } = require('./AuditService');

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

class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.fields = fields;
  }
}

class ProductService {
  constructor() {
    this.auditService = new AuditService();
  }

  async createProduct(productData, user) {
    const { sku, description, purchasePrice, salePrice } = productData;
    
    const validationErrors = [];
    if (!sku) validationErrors.push('sku');
    if (!description) validationErrors.push('description');
    if (purchasePrice === undefined || purchasePrice === null) validationErrors.push('purchasePrice');
    if (salePrice === undefined || salePrice === null) validationErrors.push('salePrice');

    
    if (validationErrors.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${validationErrors.join(', ')}`,
        validationErrors
      );
    }
    
    const existingProduct = await getProductBySKU(sku);
    if (existingProduct) {
      throw new DuplicateSKUError(sku);
    }
    
    const product = await createProduct(productData, user.userId || user.id);
    
    await this.auditService.logAction(user, 'CREATE_PRODUCT', {
      table: 'products',
      id: sku,
      oldValues: null,
      newValues: productData
    });
    
    return product;
  }

  async updateProduct(sku, updates, user) {
    const existingProduct = await getProductBySKU(sku);
    
    if (!existingProduct) {
      throw new ProductNotFoundError(sku);
    }
    
    const priceChanged = 
      (updates.purchasePrice !== undefined && updates.purchasePrice !== existingProduct.purchasePrice) ||
      (updates.salePrice !== undefined && updates.salePrice !== existingProduct.salePrice);
    
    if (priceChanged) {
      await query(
        `INSERT INTO price_history (sku, previous_purchase_price, new_purchase_price, previous_sale_price, new_sale_price, changed_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          sku,
          existingProduct.purchasePrice,
          updates.purchasePrice !== undefined ? updates.purchasePrice : existingProduct.purchasePrice,
          existingProduct.salePrice,
          updates.salePrice !== undefined ? updates.salePrice : existingProduct.salePrice,
          user.userId || user.id
        ]
      );
    }
    
    const updatedProduct = await updateProduct(sku, updates, user.userId || user.id);

    
    await this.auditService.logAction(user, 'UPDATE_PRODUCT', {
      table: 'products',
      id: sku,
      oldValues: {
        description: existingProduct.description,
        purchasePrice: existingProduct.purchasePrice,
        salePrice: existingProduct.salePrice
      },
      newValues: updates
    });
    
    return updatedProduct;
  }

  async deleteProduct(sku, user) {
    throw new ProductDeletionNotAllowedError();
  }

  async searchProducts(searchQuery) {
    const startTime = Date.now();
    const results = await searchProducts(searchQuery);
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      console.warn(`Product search took ${duration}ms, exceeding 1-second requirement`);
    }
    
    return results;
  }

  async getProductBySKU(sku) {
    const product = await getProductBySKU(sku);
    
    if (!product) {
      throw new ProductNotFoundError(sku);
    }
    
    return product;
  }

  async getAllProducts() {
    return await getAllProducts();
  }
}

module.exports = {
  ProductService,
  DuplicateSKUError,
  ProductNotFoundError,
  ProductDeletionNotAllowedError,
  ValidationError
};
