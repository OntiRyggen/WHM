const { ShipmentService } = require('../src/services/ShipmentService');
const { OrderService } = require('../src/services/OrderService');
const { ProductService } = require('../src/services/ProductService');
const { InventoryService, InsufficientStockError } = require('../src/services/InventoryService');
const { createLocation, getLocationByName } = require('../src/models/Location');
const { closePool } = require('../src/db/connection');

describe('Shipment and Order Processing', () => {
  let shipmentService;
  let orderService;
  let productService;
  let inventoryService;
  let testUser;
  let testLocation;

  beforeAll(async () => {
    shipmentService = new ShipmentService();
    orderService = new OrderService();
    productService = new ProductService();
    inventoryService = new InventoryService();
    testUser = { userId: 1, username: 'test_manager', role: 'MANAGER' };
    
    try {
      testLocation = await createLocation('Main Warehouse', 'Primary storage location');
    } catch (error) {
      testLocation = await getLocationByName('Main Warehouse');
    }
  });

  afterAll(async () => {
    await closePool();
  });

  describe('ShipmentService', () => {
    test('should create shipment and increase inventory', async () => {
      const sku = `SHIP-${Date.now()}`;
      
      await productService.createProduct({
        sku,
        description: 'Shipment Test Product',
        purchasePrice: 10,
        salePrice: 20
      }, testUser);

      const shipmentData = {
        supplierName: 'Test Supplier',
        arrivalDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 100 }]
      };

      const shipment = await shipmentService.createShipment(shipmentData, testUser);
      
      expect(shipment).toBeDefined();
      expect(shipment.shipmentId).toMatch(/^SHP-/);
      expect(shipment.supplierName).toBe('Test Supplier');

      
      const inventory = await inventoryService.getInventory(sku);
      expect(inventory.quantity).toBe(100);
    });

    test('should generate unique shipment IDs', async () => {
      const id1 = shipmentService.generateShipmentId();
      const id2 = shipmentService.generateShipmentId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^SHP-/);
      expect(id2).toMatch(/^SHP-/);
    });

    test('should reject shipment with non-existent product', async () => {
      const shipmentData = {
        supplierName: 'Test Supplier',
        arrivalDate: new Date().toISOString().split('T')[0],
        items: [{ sku: 'NONEXISTENT-SKU', quantity: 10 }]
      };

      await expect(
        shipmentService.createShipment(shipmentData, testUser)
      ).rejects.toThrow();
    });
  });

  describe('OrderService', () => {
    test('should create order and decrease inventory', async () => {
      const sku = `ORD-${Date.now()}`;
      
      await productService.createProduct({
        sku,
        description: 'Order Test Product',
        purchasePrice: 15,
        salePrice: 25
      }, testUser);

      await shipmentService.createShipment({
        supplierName: 'Test Supplier',
        arrivalDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 50 }]
      }, testUser);

      const orderData = {
        customerName: 'Test Customer',
        orderDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 20 }]
      };

      const order = await orderService.createOrder(orderData, testUser);
      
      expect(order).toBeDefined();
      expect(order.orderId).toMatch(/^ORD-/);
      expect(order.customerName).toBe('Test Customer');
      
      const inventory = await inventoryService.getInventory(sku);
      expect(inventory.quantity).toBe(30);
    });


    test('should prevent order with insufficient stock', async () => {
      const sku = `INSUF-${Date.now()}`;
      
      await productService.createProduct({
        sku,
        description: 'Insufficient Stock Test',
        purchasePrice: 10,
        salePrice: 20
      }, testUser);

      await shipmentService.createShipment({
        supplierName: 'Test Supplier',
        arrivalDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 10 }]
      }, testUser);

      const orderData = {
        customerName: 'Test Customer',
        orderDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 20 }]
      };

      await expect(
        orderService.createOrder(orderData, testUser)
      ).rejects.toThrow(InsufficientStockError);
    });

    test('should calculate profit correctly', async () => {
      const sku = `PROFIT-${Date.now()}`;
      
      await productService.createProduct({
        sku,
        description: 'Profit Test Product',
        purchasePrice: 10,
        salePrice: 25
      }, testUser);

      await shipmentService.createShipment({
        supplierName: 'Test Supplier',
        arrivalDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 100 }]
      }, testUser);

      const order = await orderService.createOrder({
        customerName: 'Test Customer',
        orderDate: new Date().toISOString().split('T')[0],
        items: [{ sku, quantity: 10 }]
      }, testUser);

      const orderWithProfit = await orderService.getOrderWithProfit(order.orderId);
      
      expect(orderWithProfit.totalPurchaseCost).toBe(100);
      expect(orderWithProfit.totalSaleRevenue).toBe(250);
      expect(orderWithProfit.profit).toBe(150);
      expect(orderWithProfit.profitMargin).toBe(60);
    });

    test('should generate unique order IDs', async () => {
      const id1 = orderService.generateOrderId();
      const id2 = orderService.generateOrderId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ORD-/);
      expect(id2).toMatch(/^ORD-/);
    });
  });
});
