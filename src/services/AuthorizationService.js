class AuthorizationError extends Error {
  constructor(message, requiredRole) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.requiredRole = requiredRole;
  }
}

const ROLES = {
  MANAGER: 'MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

const PERMISSIONS = {
  VIEW_PRICING: 'view_pricing',
  UPDATE_PRICING: 'update_pricing',
  CREATE_PRODUCT: 'create_product',
  UPDATE_PRODUCT: 'update_product',
  DELETE_PRODUCT: 'delete_product',
  CREATE_SHIPMENT: 'create_shipment',
  CREATE_ORDER: 'create_order',
  VIEW_INVENTORY: 'view_inventory',
  UPDATE_INVENTORY: 'update_inventory',
  VIEW_REPORTS: 'view_reports',
  VIEW_PROFIT: 'view_profit',
  VIEW_AUDIT_LOGS: 'view_audit_logs'
};

const ROLE_PERMISSIONS = {
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_PRICING,
    PERMISSIONS.UPDATE_PRICING,
    PERMISSIONS.CREATE_PRODUCT,
    PERMISSIONS.UPDATE_PRODUCT,
    PERMISSIONS.DELETE_PRODUCT,
    PERMISSIONS.CREATE_SHIPMENT,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.UPDATE_INVENTORY,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_PROFIT,
    PERMISSIONS.VIEW_AUDIT_LOGS
  ],
  [ROLES.WAREHOUSE_STAFF]: [
    PERMISSIONS.CREATE_SHIPMENT,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.UPDATE_INVENTORY
  ]
};

class AuthorizationService {
  hasPermission(user, operation) {
    if (!user || !user.role) {
      return false;
    }

    
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    return rolePermissions.includes(operation);
  }

  isManager(user) {
    return user && user.role === ROLES.MANAGER;
  }

  isWarehouseStaff(user) {
    return user && user.role === ROLES.WAREHOUSE_STAFF;
  }

  requirePermission(user, operation) {
    if (!this.hasPermission(user, operation)) {
      throw new AuthorizationError(
        `Access denied. Required permission: ${operation}`,
        this.getRequiredRole(operation)
      );
    }
  }

  getRequiredRole(operation) {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      if (permissions.includes(operation)) {
        return role;
      }
    }
    return null;
  }
}

module.exports = {
  AuthorizationService,
  AuthorizationError,
  ROLES,
  PERMISSIONS
};
