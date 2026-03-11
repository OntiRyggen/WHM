const { createShipment, getShipmentById, getShipmentsByDateRange } = require('../models/Shipment');
const { getProductBySKU } = require('../models/Product');
const { query, getConnection } = require('../db/connection');
const { InventoryService } = require('./InventoryService');
const { AuditService } = require('./AuditService');
const { ValidationError, ProductNotFoundError } = require('./ProductService');
const { v4: uuidv4 } = require('crypto');

class ShipmentService {
  constructor() {
    this.inventoryService = new InventoryService();
    this.auditService = new AuditService();
  }

  async createShipment(shipmentData, user) {
    const { supplierName, arrivalDate, items } = shipmentData;
    
    const validationErrors = [];
    if (!supplierName) validationErrors.push('supplierName');
    if (!arrivalDate) validationErrors.push('arrivalDate');
    if (!items || items.length === 0) validationErrors.push('items');
    
    if (validationErrors.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${validationErrors.join(', ')}`,
        validationErrors
      );
    }
    
    for (const item of items) {
      if (!item.sku || !item.quantity || item.quantity <= 0) {
        throw new ValidationError('Each item must have a valid SKU and positive quantity');
      }
    }
    
    for (const item of items) {
      const product = await getProductBySKU(item.sku);
      if (!product) {
        throw new ProductNotFoundError(item.sku);
      }
    }
    
    const shipmentId = this.generateShipmentId();
    
    const client = await getConnection();
    
    try {
      await client.query('BEGIN');

      
      const shipment = await createShipment(
        { ...shipmentData, shipmentId },
        user.userId || user.id
      );
      
      const defaultLocationId = 1;
      
      for (const item of items) {
        await this.inventoryService.ensureInventoryExists(
          item.sku,
          defaultLocationId,
          user.userId || user.id
        );
        
        await this.inventoryService.updateQuantity(item.sku, item.quantity, user);
        
        await client.query(
          `INSERT INTO transactions (transaction_type, reference_id, sku, quantity, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          ['INCOMING', shipmentId, item.sku, item.quantity, user.userId || user.id]
        );
      }
      
      await this.auditService.logAction(user, 'CREATE_SHIPMENT', {
        table: 'shipments',
        id: shipmentId,
        oldValues: null,
        newValues: { supplierName, arrivalDate, items }
      });
      
      await client.query('COMMIT');
      return shipment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  generateShipmentId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SHP-${timestamp}-${random}`;
  }

  async getShipment(shipmentId) {
    const shipment = await getShipmentById(shipmentId);
    
    if (!shipment) {
      throw new Error(`Shipment '${shipmentId}' not found`);
    }
    
    return shipment;
  }

  async getShipmentsByDateRange(startDate, endDate) {
    return await getShipmentsByDateRange(startDate, endDate);
  }
}

module.exports = {
  ShipmentService
};
