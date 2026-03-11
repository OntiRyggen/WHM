const { createOrder, getOrderById, getOrdersByDateRange } = require('../models/Order');
const { getProductBySKU } = require('../models/Product');
const { query, getConnection } = require('../db/connection');
const { InventoryService, InsufficientStockError } = require('./InventoryService');
const { AuditService } = require('./AuditService');
const { ValidationError, ProductNotFoundError } = require('./ProductService');

class OrderService {
  constructor() {
    this.inventoryService = new InventoryService();
    this.auditService = new AuditService();
  }

  async createOrder(orderData, user) {
    const { customerName, orderDate, items } = orderData;
    
    const validationErrors = [];
    if (!customerName) validationErrors.push('customerName');
    if (!orderDate) validationErrors.push('orderDate');
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
    
    const itemsWithPrices = [];
    
    for (const item of items) {
      const product = await getProductBySKU(item.sku);
      if (!product) {
        throw new ProductNotFoundError(item.sku);
      }
      
      const hasStock = await this.inventoryService.hasAvailableStock(item.sku, item.quantity);
      if (!hasStock) {
        const inventory = await this.inventoryService.getInventory(item.sku);
        throw new InsufficientStockError(item.sku, item.quantity, inventory ? inventory.quantity : 0);
      }

      
      itemsWithPrices.push({
        sku: item.sku,
        quantity: item.quantity,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice
      });
    }
    
    const orderId = this.generateOrderId();
    
    const client = await getConnection();
    
    try {
      await client.query('BEGIN');
      
      const order = await createOrder(
        { ...orderData, orderId, items: itemsWithPrices },
        user.userId || user.id
      );
      
      for (const item of itemsWithPrices) {
        await this.inventoryService.updateQuantity(item.sku, -item.quantity, user);
        
        await client.query(
          `INSERT INTO transactions (transaction_type, reference_id, sku, quantity, user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          ['OUTGOING', orderId, item.sku, item.quantity, user.userId || user.id]
        );
      }
      
      await this.auditService.logAction(user, 'CREATE_ORDER', {
        table: 'orders',
        id: orderId,
        oldValues: null,
        newValues: { customerName, orderDate, items: itemsWithPrices }
      });
      
      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }


  async getOrderWithProfit(orderId) {
    const order = await getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order '${orderId}' not found`);
    }
    
    let totalPurchaseCost = 0;
    let totalSaleRevenue = 0;
    
    for (const item of order.items) {
      totalPurchaseCost += item.quantity * item.purchasePrice;
      totalSaleRevenue += item.quantity * item.salePrice;
    }
    
    const profit = totalSaleRevenue - totalPurchaseCost;
    const profitMargin = totalSaleRevenue > 0 
      ? (profit / totalSaleRevenue) * 100 
      : 0;
    
    return {
      ...order,
      totalPurchaseCost,
      totalSaleRevenue,
      profit,
      profitMargin: parseFloat(profitMargin.toFixed(2))
    };
  }

  async getOrder(orderId) {
    const order = await getOrderById(orderId);
    
    if (!order) {
      throw new Error(`Order '${orderId}' not found`);
    }
    
    return order;
  }

  async getOrdersByDateRange(startDate, endDate) {
    return await getOrdersByDateRange(startDate, endDate);
  }
}

module.exports = {
  OrderService
};
