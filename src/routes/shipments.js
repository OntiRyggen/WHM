const express = require('express');
const { ShipmentService } = require('../services/ShipmentService');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../middleware/auth');

const router = express.Router();
const shipmentService = new ShipmentService();

router.post('/', authenticateToken, requirePermission(PERMISSIONS.CREATE_SHIPMENT), async (req, res) => {
  try {
    const shipment = await shipmentService.createShipment(req.body, req.user);
    res.status(201).json({ success: true, shipment });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', message: error.message });
    }
    if (error.name === 'ProductNotFoundError') {
      return res.status(404).json({ error: 'Product not found', message: error.message });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const shipment = await shipmentService.getShipment(req.params.id);
    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (startDate && endDate) {
      const shipments = await shipmentService.getShipmentsByDateRange(startDate, endDate);
      return res.json({ success: true, shipments });
    }
    res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
