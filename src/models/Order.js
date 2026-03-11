const { query, getConnection } = require('../db/connection');

class Order {
  constructor(data) {
    this.id = data.id;
    this.orderId = data.order_id;
    this.customerName = data.customer_name;
    this.orderDate = data.order_date;
    this.createdAt = data.created_at;
    this.createdBy = data.created_by;
    this.items = data.items || [];
  }
}

async function createOrder(orderData, userId) {
  const { orderId, customerName, orderDate, items } = orderData;
  
  const client = await getConnection();
  
  try {
    await client.query('START TRANSACTION');
    
    const orderResult = await client.query(
      `INSERT INTO orders (order_id, customer_name, order_date, created_by)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
      [orderId, customerName, orderDate, userId]
    );
    
    const order = new Order(orderResult.rows[0]);
    
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, sku, quantity, purchase_price, sale_price)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.sku, item.quantity, item.purchasePrice, item.salePrice]
      );
    }
    
    order.items = items;
    
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getOrderById(orderId) {
  const orderResult = await query(
    'SELECT * FROM orders WHERE order_id = ?',
    [orderId]
  );
  
  if (orderResult.rows.length === 0) {
    return null;
  }

  
  const order = new Order(orderResult.rows[0]);
  
  const itemsResult = await query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId]
  );
  
  order.items = itemsResult.rows.map(row => ({
    sku: row.sku,
    quantity: parseInt(row.quantity),
    purchasePrice: parseFloat(row.purchase_price),
    salePrice: parseFloat(row.sale_price)
  }));
  
  return order;
}

async function getOrdersByDateRange(startDate, endDate) {
  const result = await query(
    `SELECT * FROM orders 
     WHERE order_date >= ? AND order_date <= ?
     ORDER BY order_date DESC`,
    [startDate, endDate]
  );
  
  const orders = [];
  
  for (const row of result.rows) {
    const order = new Order(row);
    
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.orderId]
    );
    
    order.items = itemsResult.rows.map(itemRow => ({
      sku: itemRow.sku,
      quantity: parseInt(itemRow.quantity),
      purchasePrice: parseFloat(itemRow.purchase_price),
      salePrice: parseFloat(itemRow.sale_price)
    }));
    
    orders.push(order);
  }
  
  return orders;
}

async function getAllOrders() {
  const result = await query(
    'SELECT * FROM orders ORDER BY order_date DESC'
  );
  
  return result.rows.map(row => new Order(row));
}

module.exports = {
  Order,
  createOrder,
  getOrderById,
  getOrdersByDateRange,
  getAllOrders
};
