const express = require('express');
const { AuditService } = require('../services/AuditService');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();
const auditService = new AuditService();

router.get('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { userId, startDate, endDate, action, table } = req.query;
    
    const filters = {};
    if (userId) filters.userId = parseInt(userId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (action) filters.action = action;
    if (table) filters.table = table;
    
    const logs = await auditService.getAuditLogs(filters);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
