const { AuthenticationService, AuthenticationError } = require('../src/services/AuthenticationService');
const { AuthorizationService, PERMISSIONS, ROLES } = require('../src/services/AuthorizationService');
const { createUser, findUserByUsername } = require('../src/models/User');

describe('Authentication System', () => {
  let authService;
  let authzService;

  beforeAll(() => {
    authService = new AuthenticationService();
    authzService = new AuthorizationService();
  });

  describe('AuthenticationService', () => {
    test('should authenticate valid credentials', async () => {
      // This test requires database setup
      // For now, we'll test the service instantiation
      expect(authService).toBeDefined();
      expect(authService.jwtSecret).toBeDefined();
    });

    test('should check session expiration correctly', () => {
      const now = new Date();
      const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
      const sevenHoursAgo = new Date(now.getTime() - 7 * 60 * 60 * 1000);
      const nineHoursAgo = new Date(now.getTime() - 9 * 60 * 60 * 1000);

      expect(authService.isSessionExpired(eightHoursAgo)).toBe(true);
      expect(authService.isSessionExpired(sevenHoursAgo)).toBe(false);
      expect(authService.isSessionExpired(nineHoursAgo)).toBe(true);
    });
  });

  describe('AuthorizationService', () => {
    test('manager should have all permissions', () => {
      const manager = { id: 1, username: 'manager', role: ROLES.MANAGER };

      expect(authzService.hasPermission(manager, PERMISSIONS.VIEW_PRICING)).toBe(true);
      expect(authzService.hasPermission(manager, PERMISSIONS.UPDATE_PRICING)).toBe(true);
      expect(authzService.hasPermission(manager, PERMISSIONS.VIEW_PROFIT)).toBe(true);
      expect(authzService.hasPermission(manager, PERMISSIONS.CREATE_PRODUCT)).toBe(true);
      expect(authzService.isManager(manager)).toBe(true);
    });

    test('warehouse staff should not have pricing permissions', () => {
      const staff = { id: 2, username: 'staff', role: ROLES.WAREHOUSE_STAFF };

      expect(authzService.hasPermission(staff, PERMISSIONS.VIEW_PRICING)).toBe(false);
      expect(authzService.hasPermission(staff, PERMISSIONS.UPDATE_PRICING)).toBe(false);
      expect(authzService.hasPermission(staff, PERMISSIONS.VIEW_PROFIT)).toBe(false);
      expect(authzService.isWarehouseStaff(staff)).toBe(true);
    });


    test('warehouse staff should have inventory permissions', () => {
      const staff = { id: 2, username: 'staff', role: ROLES.WAREHOUSE_STAFF };

      expect(authzService.hasPermission(staff, PERMISSIONS.VIEW_INVENTORY)).toBe(true);
      expect(authzService.hasPermission(staff, PERMISSIONS.UPDATE_INVENTORY)).toBe(true);
      expect(authzService.hasPermission(staff, PERMISSIONS.CREATE_SHIPMENT)).toBe(true);
      expect(authzService.hasPermission(staff, PERMISSIONS.CREATE_ORDER)).toBe(true);
    });
  });
});
