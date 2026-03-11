const { AuthenticationService } = require('../services/AuthenticationService');
const { AuthorizationService, PERMISSIONS } = require('../services/AuthorizationService');

const authService = new AuthenticationService();
const authzService = new AuthorizationService();

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }
    
    const user = await authService.validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: error.message
      });
    }
    if (error.name === 'InvalidTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
    }
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

function requirePermission(permission) {
  return (req, res, next) => {
    try {
      authzService.requirePermission(req.user, permission);
      next();
    } catch (error) {
      if (error.name === 'AuthorizationError') {
        return res.status(403).json({
          error: 'Access denied',
          message: error.message,
          requiredRole: error.requiredRole
        });
      }
      return res.status(500).json({
        error: 'Authorization check failed',
        message: error.message
      });
    }
  };
}


function requireManager(req, res, next) {
  if (!authzService.isManager(req.user)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Manager role required',
      requiredRole: 'MANAGER'
    });
  }
  next();
}

function requireWarehouseStaff(req, res, next) {
  if (!authzService.isWarehouseStaff(req.user) && !authzService.isManager(req.user)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Warehouse staff or manager role required'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requirePermission,
  requireManager,
  requireWarehouseStaff,
  PERMISSIONS
};
