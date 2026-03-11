const express = require('express');
const { OrderService } = require('../services/OrderService');
const { authenticateToken, requirePermission, requireManager, PERMISSIONS } = require('../middleware/auth');

const router = express.Router();
const orderService = new OrderService();

router.post('/', authenticateToken, requirePermission(PERMISSIONS.CREATE_ORDER), async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body, req.user);
    res.status(201).json({ success: true, order });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', message: error.message });
    }
    if (error.name === 'ProductNotFoundError') {
      return res.status(404).json({ error: 'Product not found', message: error.message });
    }
    if (error.name === 'InsufficientStockError') {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        message: error.message,
        details: { sku: error.sku, requested: error.requested, available: error.available }
      });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { includeProfit } = req.query;
    
    if (includeProfit === 'true') {
      const { AuthorizationService } = require('../services/AuthorizationService');
      const authzService = new AuthorizationService();
      
      if (!authzService.isManager(req.user)) {
        return res.status(403).json({ 
          error: 'Access denied', 
          message: 'Profit information is only available to managers' 
        });
      }
      
      const order = await orderService.getOrderWithProfit(req.params.id);
      return res.json({ success: true, order });
    }
    
    const order = await orderService.getOrder(req.params.id);
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
      const orders = await orderService.getOrdersByDateRange(startDate, endDate);
      return res.json({ success: true, orders });
    }
    res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
