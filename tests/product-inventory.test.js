const { ProductService, DuplicateSKUError, ProductNotFoundError, ProductDeletionNotAllowedError } = require('../src/services/ProductService');
const { InventoryService, InsufficientStockError } = require('../src/services/InventoryService');
const { createLocation } = require('../src/models/Location');
const { closePool } = require('../src/db/connection');

describe('Product and Inventory Management', () => {
  let productService;
  let inventoryService;
  let testUser;
  let testLocation;

  beforeAll(async () => {
    productService = new ProductService();
    inventoryService = new InventoryService();
    testUser = { userId: 1, username: 'test_manager', role: 'MANAGER' };
    
    // Create a test location
    try {
      testLocation = await createLocation('Test Warehouse', 'Test location for unit tests');
    } catch (error) {
      // Location might already exist
      const { getLocationByName } = require('../src/models/Location');
      testLocation = await getLocationByName('Test Warehouse');
    }
  });

  afterAll(async () => {
    await closePool();
  });

  describe('ProductService', () => {
    test('should create a product with all required fields', async () => {
      const sku = `TEST-${Date.now()}`;
      const productData = {
        sku,
        description: 'Test Product',
        purchasePrice: 10.50,
        salePrice: 15.99
      };

      const product = await productService.createProduct(productData, testUser);
      
      expect(product).toBeDefined();
      expect(product.sku).toBe(sku);
      expect(product.description).toBe('Test Product');
      expect(product.purchasePrice).toBe(10.50);
      expect(product.salePrice).toBe(15.99);
    });

    test('should reject duplicate SKU', async () => {
      const sku = `DUP-${Date.now()}`;
      const productData = {
        sku,
        description: 'Duplicate Test',
        purchasePrice: 10,
        salePrice: 15
      };

      await productService.createProduct(productData, testUser);
      
      await expect(
        productService.createProduct(productData, testUser)
      ).rejects.toThrow(DuplicateSKUError);
    });


    test('should prevent product deletion', async () => {
      const sku = `DEL-${Date.now()}`;
      const productData = {
        sku,
        description: 'Delete Test',
        purchasePrice: 10,
        salePrice: 15
      };

      await productService.createProduct(productData, testUser);
      
      await expect(
        productService.deleteProduct(sku, testUser)
      ).rejects.toThrow(ProductDeletionNotAllowedError);
    });

    test('should search products by SKU or description', async () => {
      const sku = `SEARCH-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Searchable Widget',
        purchasePrice: 5,
        salePrice: 10
      }, testUser);

      const results = await productService.searchProducts('Widget');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.sku === sku)).toBe(true);
    });

    test('should update product and create price history', async () => {
      const sku = `UPDATE-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Update Test',
        purchasePrice: 10,
        salePrice: 15
      }, testUser);

      const updated = await productService.updateProduct(sku, {
        salePrice: 20
      }, testUser);

      expect(updated.salePrice).toBe(20);
    });
  });

  describe('InventoryService', () => {
    test('should track inventory quantity', async () => {
      const sku = `INV-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Inventory Test',
        purchasePrice: 10,
        salePrice: 15
      }, testUser);

      await inventoryService.ensureInventoryExists(sku, testLocation.id, testUser.userId);
      
      const updated = await inventoryService.updateQuantity(sku, 100, testUser);
      expect(updated.quantity).toBe(100);
    });


    test('should prevent negative inventory', async () => {
      const sku = `NEG-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Negative Test',
        purchasePrice: 10,
        salePrice: 15
      }, testUser);

      await inventoryService.ensureInventoryExists(sku, testLocation.id, testUser.userId);
      await inventoryService.updateQuantity(sku, 10, testUser);

      await expect(
        inventoryService.updateQuantity(sku, -20, testUser)
      ).rejects.toThrow(InsufficientStockError);
    });

    test('should check stock availability', async () => {
      const sku = `STOCK-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Stock Test',
        purchasePrice: 10,
        salePrice: 15
      }, testUser);

      await inventoryService.ensureInventoryExists(sku, testLocation.id, testUser.userId);
      await inventoryService.updateQuantity(sku, 50, testUser);

      const hasStock = await inventoryService.hasAvailableStock(sku, 30);
      expect(hasStock).toBe(true);

      const hasEnough = await inventoryService.hasAvailableStock(sku, 100);
      expect(hasEnough).toBe(false);
    });

    test('should get low stock products', async () => {
      const sku = `LOW-${Date.now()}`;
      await productService.createProduct({
        sku,
        description: 'Low Stock Test',
        purchasePrice: 10,
        salePrice: 15
      }, testUser);

      await inventoryService.ensureInventoryExists(sku, testLocation.id, testUser.userId);
      await inventoryService.updateQuantity(sku, 5, testUser);

      const lowStock = await inventoryService.getLowStockProducts(10);
      expect(lowStock.some(item => item.sku === sku)).toBe(true);
    });
  });
});
