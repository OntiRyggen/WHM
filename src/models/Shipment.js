const { query, getConnection } = require('../db/connection');

class Shipment {
  constructor(data) {
    this.id = data.id;
    this.shipmentId = data.shipment_id;
    this.supplierName = data.supplier_name;
    this.arrivalDate = data.arrival_date;
    this.createdAt = data.created_at;
    this.createdBy = data.created_by;
    this.items = data.items || [];
  }
}

async function createShipment(shipmentData, userId) {
  const { shipmentId, supplierName, arrivalDate, items } = shipmentData;
  
  const client = await getConnection();
  
  try {
    await client.query('START TRANSACTION');
    
    const shipmentResult = await client.query(
      `INSERT INTO shipments (shipment_id, supplier_name, arrival_date, created_by)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [shipmentId, supplierName, arrivalDate, userId]
    );
    
    const shipment = new Shipment(shipmentResult.rows[0]);
    
    for (const item of items) {
      await client.query(
        `INSERT INTO shipment_items (shipment_id, sku, quantity)
         VALUES (?, ?, ?)`,
        [shipmentId, item.sku, item.quantity]
      );
    }
    
    shipment.items = items;
    
    await client.query('COMMIT');
    return shipment;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getShipmentById(shipmentId) {
  const shipmentResult = await query(
    'SELECT * FROM shipments WHERE shipment_id = ?',
    [shipmentId]
  );
  
  if (shipmentResult.rows.length === 0) {
    return null;
  }

  
  const shipment = new Shipment(shipmentResult.rows[0]);
  
  const itemsResult = await query(
    'SELECT * FROM shipment_items WHERE shipment_id = ?',
    [shipmentId]
  );
  
  shipment.items = itemsResult.rows.map(row => ({
    sku: row.sku,
    quantity: parseInt(row.quantity)
  }));
  
  return shipment;
}

async function getShipmentsByDateRange(startDate, endDate) {
  const result = await query(
    `SELECT * FROM shipments 
     WHERE arrival_date >= ? AND arrival_date <= ?
     ORDER BY arrival_date DESC`,
    [startDate, endDate]
  );
  
  const shipments = [];
  
  for (const row of result.rows) {
    const shipment = new Shipment(row);
    
    const itemsResult = await query(
      'SELECT * FROM shipment_items WHERE shipment_id = ?',
      [shipment.shipmentId]
    );
    
    shipment.items = itemsResult.rows.map(itemRow => ({
      sku: itemRow.sku,
      quantity: parseInt(itemRow.quantity)
    }));
    
    shipments.push(shipment);
  }
  
  return shipments;
}

async function getAllShipments() {
  const result = await query(
    'SELECT * FROM shipments ORDER BY arrival_date DESC'
  );
  
  return result.rows.map(row => new Shipment(row));
}

module.exports = {
  Shipment,
  createShipment,
  getShipmentById,
  getShipmentsByDateRange,
  getAllShipments
};
