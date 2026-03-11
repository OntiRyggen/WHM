const { query } = require('../db/connection');

class Product {
  constructor(data) {
    this.sku = data.sku;
    this.description = data.description;
    this.purchasePrice = parseFloat(data.purchase_price);
    this.salePrice = parseFloat(data.sale_price);
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.createdBy = data.created_by;
  }
}

async function createProduct(productData, userId) {
  const { sku, description, purchasePrice, salePrice } = productData;
  
  const result = await query(
    `INSERT INTO products (sku, description, purchase_price, sale_price, created_by)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`,
    [sku, description, purchasePrice, salePrice, userId]
  );
  
  return new Product(result.rows[0]);
}

async function getProductBySKU(sku) {
  const result = await query(
    'SELECT * FROM products WHERE sku = ?',
    [sku]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new Product(result.rows[0]);
}

async function updateProduct(sku, updates, userId) {
  const fields = [];
  const values = [];
  
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  
  if (updates.purchasePrice !== undefined) {
    fields.push('purchase_price = ?');
    values.push(updates.purchasePrice);
  }

  
  if (updates.salePrice !== undefined) {
    fields.push('sale_price = ?');
    values.push(updates.salePrice);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(sku);
  
  const result = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE sku = ?
     RETURNING *`,
    values
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new Product(result.rows[0]);
}

async function searchProducts(searchQuery) {
  const result = await query(
    `SELECT * FROM products 
     WHERE sku LIKE ? OR description LIKE ?
     ORDER BY sku`,
    [`%${searchQuery}%`, `%${searchQuery}%`]
  );
  
  return result.rows.map(row => new Product(row));
}

async function getAllProducts() {
  const result = await query('SELECT * FROM products ORDER BY sku');
  return result.rows.map(row => new Product(row));
}

module.exports = {
  Product,
  createProduct,
  getProductBySKU,
  updateProduct,
  searchProducts,
  getAllProducts
};
