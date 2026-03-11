const express = require('express');
const { InventoryService } = require('../services/InventoryService');
const { authenticateToken, requirePermission, PERMISSIONS } = require('../middleware/auth');

const router = express.Router();
const inventoryService = new InventoryService();

router.get('/', authenticateToken, requirePermission(PERMISSIONS.VIEW_INVENTORY), async (req, res) => {
  try {
    const inventory = await inventoryService.getAllInventory();
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:sku', authenticateToken, requirePermission(PERMISSIONS.VIEW_INVENTORY), async (req, res) => {
  try {
    const inventory = await inventoryService.getInventory(req.params.sku);
    if (!inventory) {
      return res.status(404).json({ error: 'Not found', message: `No inventory found for SKU '${req.params.sku}'` });
    }
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/:sku/location', authenticateToken, requirePermission(PERMISSIONS.UPDATE_INVENTORY), async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ error: 'Missing location', message: 'Location is required' });
    }
    const inventory = await inventoryService.moveLocation(req.params.sku, location, req.user);
    res.json({ success: true, inventory });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
