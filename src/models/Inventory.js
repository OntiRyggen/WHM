const { query } = require('../db/connection');

class InventoryRecord {
  constructor(data) {
    this.id = data.id;
    this.sku = data.sku;
    this.quantity = parseInt(data.quantity);
    this.locationId = data.location_id;
    this.locationName = data.location_name;
    this.lastUpdated = data.last_updated;
    this.updatedBy = data.updated_by;
  }
}

async function createInventoryRecord(sku, locationId, quantity, userId) {
  const result = await query(
    `INSERT INTO inventory (sku, quantity, location_id, updated_by)
     VALUES (?, ?, ?, ?)
     RETURNING *`,
    [sku, quantity, locationId, userId]
  );
  
  return new InventoryRecord(result.rows[0]);
}

async function getInventoryBySKU(sku) {
  const result = await query(
    `SELECT i.*, l.name as location_name
     FROM inventory i
     LEFT JOIN locations l ON i.location_id = l.id
     WHERE i.sku = ?`,
    [sku]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new InventoryRecord(result.rows[0]);
}

async function getAllInventory() {
  const result = await query(
    `SELECT i.*, l.name as location_name
     FROM inventory i
     LEFT JOIN locations l ON i.location_id = l.id
     ORDER BY i.sku`
  );
  
  return result.rows.map(row => new InventoryRecord(row));
}

async function updateInventoryQuantity(sku, newQuantity, userId) {
  const result = await query(
    `UPDATE inventory 
     SET quantity = ?, last_updated = CURRENT_TIMESTAMP, updated_by = ?
     WHERE sku = ?
     RETURNING *`,
    [newQuantity, userId, sku]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new InventoryRecord(result.rows[0]);
}


async function updateInventoryLocation(sku, newLocationId, userId) {
  const result = await query(
    `UPDATE inventory 
     SET location_id = ?, last_updated = CURRENT_TIMESTAMP, updated_by = ?
     WHERE sku = ?
     RETURNING *`,
    [newLocationId, userId, sku]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new InventoryRecord(result.rows[0]);
}

async function getLowStockInventory(threshold) {
  const result = await query(
    `SELECT i.*, l.name as location_name
     FROM inventory i
     LEFT JOIN locations l ON i.location_id = l.id
     WHERE i.quantity <= ?
     ORDER BY i.quantity ASC, i.sku`,
    [threshold]
  );
  
  return result.rows.map(row => new InventoryRecord(row));
}

module.exports = {
  InventoryRecord,
  createInventoryRecord,
  getInventoryBySKU,
  getAllInventory,
  updateInventoryQuantity,
  updateInventoryLocation,
  getLowStockInventory
};
