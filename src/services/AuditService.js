const { query } = require('../db/connection');

class ImmutableLogError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImmutableLogError';
    this.statusCode = 403;
  }
}

class AuditService {
  async logAction(user, action, affectedData) {
    const { table, id, oldValues, newValues } = affectedData;
    
    await query(
      `INSERT INTO audit_logs (user_id, action, affected_table, affected_id, old_values, new_values, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        user.userId || user.id,
        action,
        table,
        id,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null
      ]
    );
  }

  async getAuditLogs(filters = {}) {
    const { userId, startDate, endDate, action, table } = filters;
    
    let queryText = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (userId) {
      queryText += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (startDate) {
      queryText += ' AND timestamp >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      queryText += ' AND timestamp <= ?';
      params.push(endDate);
    }
    
    if (action) {
      queryText += ' AND action = ?';
      params.push(action);
    }

    
    if (table) {
      queryText += ' AND affected_table = ?';
      params.push(table);
    }
    
    queryText += ' ORDER BY timestamp DESC';
    
    const result = await query(queryText, params);
    
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      affectedTable: row.affected_table,
      affectedId: row.affected_id,
      oldValues: row.old_values,
      newValues: row.new_values,
      timestamp: row.timestamp
    }));
  }

  modifyAuditLog() {
    throw new ImmutableLogError('Audit logs cannot be modified or deleted');
  }

  deleteAuditLog() {
    throw new ImmutableLogError('Audit logs cannot be modified or deleted');
  }

  updateAuditLog() {
    throw new ImmutableLogError('Audit logs cannot be modified or deleted');
  }
}

module.exports = {
  AuditService,
  ImmutableLogError
};
