const express = require('express');
const { ProductService } = require('../services/ProductService');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../middleware/auth');

const router = express.Router();
const productService = new ProductService();

router.post('/', authenticateToken, requirePermission(PERMISSIONS.CREATE_PRODUCT), async (req, res) => {
  try {
    const product = await productService.createProduct(req.body, req.user);
    res.status(201).json({ success: true, product });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', message: error.message, fields: error.fields });
    }
    if (error.name === 'DuplicateSKUError') {
      return res.status(409).json({ error: 'Duplicate SKU', message: error.message });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/:sku', authenticateToken, requirePermission(PERMISSIONS.UPDATE_PRODUCT), async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.sku, req.body, req.user);
    res.json({ success: true, product });
  } catch (error) {
    if (error.name === 'ProductNotFoundError') {
      return res.status(404).json({ error: 'Not found', message: error.message });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/:sku', authenticateToken, requirePermission(PERMISSIONS.DELETE_PRODUCT), async (req, res) => {
  try {
    await productService.deleteProduct(req.params.sku, req.user);
    res.json({ success: true });
  } catch (error) {
    if (error.name === 'ProductDeletionNotAllowedError') {
      return res.status(403).json({ error: 'Operation not allowed', message: error.message });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter', message: 'Query parameter "q" is required' });
    }
    const products = await productService.searchProducts(q);
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:sku', authenticateToken, async (req, res) => {
  try {
    const product = await productService.getProductBySKU(req.params.sku);
    res.json({ success: true, product });
  } catch (error) {
    if (error.name === 'ProductNotFoundError') {
      return res.status(404).json({ error: 'Not found', message: error.message });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
