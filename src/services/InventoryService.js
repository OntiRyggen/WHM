const { 
  getInventoryBySKU, 
  getAllInventory, 
  updateInventoryQuantity, 
  updateInventoryLocation,
  createInventoryRecord,
  getLowStockInventory
} = require('../models/Inventory');
const { getLocationByName, getLocationById } = require('../models/Location');
const { getConnection } = require('../db/connection');
const { AuditService } = require('./AuditService');

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

class InventoryService {
  constructor() {
    this.auditService = new AuditService();
  }

  async getInventory(sku) {
    return await getInventoryBySKU(sku);
  }

  async getAllInventory() {
    return await getAllInventory();
  }

  async updateQuantity(sku, quantityChange, user) {
    const client = await getConnection();
    
    try {
      await client.query('BEGIN');
      
      const inventory = await getInventoryBySKU(sku);
      
      if (!inventory) {
        throw new Error(`No inventory record found for SKU '${sku}'`);
      }
      
      const newQuantity = inventory.quantity + quantityChange;
      
      if (newQuantity < 0) {
        throw new InsufficientStockError(sku, Math.abs(quantityChange), inventory.quantity);
      }

      
      const updatedInventory = await updateInventoryQuantity(sku, newQuantity, user.userId || user.id);
      
      await this.auditService.logAction(user, 'UPDATE_INVENTORY_QUANTITY', {
        table: 'inventory',
        id: sku,
        oldValues: { quantity: inventory.quantity },
        newValues: { quantity: newQuantity, change: quantityChange }
      });
      
      await client.query('COMMIT');
      return updatedInventory;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async moveLocation(sku, newLocationName, user) {
    const inventory = await getInventoryBySKU(sku);
    
    if (!inventory) {
      throw new Error(`No inventory record found for SKU '${sku}'`);
    }
    
    const newLocation = await getLocationByName(newLocationName);
    
    if (!newLocation) {
      throw new Error(`Location '${newLocationName}' not found`);
    }
    
    const updatedInventory = await updateInventoryLocation(sku, newLocation.id, user.userId || user.id);
    
    await this.auditService.logAction(user, 'MOVE_INVENTORY_LOCATION', {
      table: 'inventory',
      id: sku,
      oldValues: { locationId: inventory.locationId, locationName: inventory.locationName },
      newValues: { locationId: newLocation.id, locationName: newLocation.name }
    });
    
    return updatedInventory;
  }

  async hasAvailableStock(sku, requiredQuantity) {
    const inventory = await getInventoryBySKU(sku);
    
    if (!inventory) {
      return false;
    }
    
    return inventory.quantity >= requiredQuantity;
  }


  async getLowStockProducts(threshold) {
    return await getLowStockInventory(threshold);
  }

  async ensureInventoryExists(sku, defaultLocationId, userId) {
    let inventory = await getInventoryBySKU(sku);
    
    if (!inventory) {
      inventory = await createInventoryRecord(sku, defaultLocationId, 0, userId);
    }
    
    return inventory;
  }
}

module.exports = {
  InventoryService,
  InsufficientStockError
};
