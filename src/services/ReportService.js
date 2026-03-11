const { query } = require('../db/connection');
const { getAllInventory, getLowStockInventory } = require('../models/Inventory');
const { getAllProducts } = require('../models/Product');

class ReportService {
  async generateInventoryReport() {
    const inventoryRecords = await query(
      `SELECT i.sku, i.quantity, i.last_updated, 
              l.name as location_name,
              p.description, p.sale_price
       FROM inventory i
       LEFT JOIN locations l ON i.location_id = l.id
       LEFT JOIN products p ON i.sku = p.sku
       ORDER BY i.sku`
    );
    
    const report = inventoryRecords.rows.map(row => ({
      sku: row.sku,
      description: row.description,
      quantity: parseInt(row.quantity),
      location: row.location_name,
      salePrice: parseFloat(row.sale_price),
      value: parseInt(row.quantity) * parseFloat(row.sale_price),
      lastUpdated: row.last_updated
    }));
    
    const totalValue = report.reduce((sum, item) => sum + item.value, 0);
    
    return {
      generatedAt: new Date(),
      items: report,
      summary: {
        totalProducts: report.length,
        totalValue: parseFloat(totalValue.toFixed(2))
      }
    };
  }

  async generateTransactionReport(startDate, endDate) {
    const transactions = await query(
      `SELECT t.*, 
              CASE 
                WHEN t.transaction_type = 'INCOMING' THEN s.supplier_name
                WHEN t.transaction_type = 'OUTGOING' THEN o.customer_name
              END as party_name,
              CASE 
                WHEN t.transaction_type = 'INCOMING' THEN s.arrival_date
                WHEN t.transaction_type = 'OUTGOING' THEN o.order_date
              END as transaction_date,
              p.description
       FROM transactions t
       LEFT JOIN shipments s ON t.transaction_type = 'INCOMING' AND t.reference_id = s.shipment_id
       LEFT JOIN orders o ON t.transaction_type = 'OUTGOING' AND t.reference_id = o.order_id
       LEFT JOIN products p ON t.sku = p.sku
       WHERE t.timestamp >= $1 AND t.timestamp <= $2
       ORDER BY t.timestamp DESC`,
      [startDate, endDate]
    );

    
    const report = transactions.rows.map(row => ({
      id: row.id,
      type: row.transaction_type,
      referenceId: row.reference_id,
      sku: row.sku,
      description: row.description,
      quantity: parseInt(row.quantity),
      partyName: row.party_name,
      transactionDate: row.transaction_date,
      timestamp: row.timestamp
    }));
    
    const incoming = report.filter(t => t.type === 'INCOMING');
    const outgoing = report.filter(t => t.type === 'OUTGOING');
    
    return {
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      transactions: report,
      summary: {
        totalTransactions: report.length,
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        totalIncomingQuantity: incoming.reduce((sum, t) => sum + t.quantity, 0),
        totalOutgoingQuantity: outgoing.reduce((sum, t) => sum + t.quantity, 0)
      }
    };
  }

  async generateProfitReport(startDate, endDate) {
    const orders = await query(
      `SELECT o.order_id, o.customer_name, o.order_date,
              oi.sku, oi.quantity, oi.purchase_price, oi.sale_price,
              p.description
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       LEFT JOIN products p ON oi.sku = p.sku
       WHERE o.order_date >= $1 AND o.order_date <= $2
       ORDER BY o.order_date DESC`,
      [startDate, endDate]
    );
    
    const orderMap = {};
    
    for (const row of orders.rows) {
      if (!orderMap[row.order_id]) {
        orderMap[row.order_id] = {
          orderId: row.order_id,
          customerName: row.customer_name,
          orderDate: row.order_date,
          items: [],
          totalPurchaseCost: 0,
          totalSaleRevenue: 0,
          profit: 0
        };
      }
      
      const purchaseCost = parseInt(row.quantity) * parseFloat(row.purchase_price);
      const saleRevenue = parseInt(row.quantity) * parseFloat(row.sale_price);
      
      orderMap[row.order_id].items.push({
        sku: row.sku,
        description: row.description,
        quantity: parseInt(row.quantity),
        purchasePrice: parseFloat(row.purchase_price),
        salePrice: parseFloat(row.sale_price)
      });
      
      orderMap[row.order_id].totalPurchaseCost += purchaseCost;
      orderMap[row.order_id].totalSaleRevenue += saleRevenue;
    }

    
    const ordersList = Object.values(orderMap).map(order => ({
      ...order,
      profit: order.totalSaleRevenue - order.totalPurchaseCost,
      profitMargin: order.totalSaleRevenue > 0 
        ? ((order.totalSaleRevenue - order.totalPurchaseCost) / order.totalSaleRevenue * 100).toFixed(2)
        : 0
    }));
    
    const totalProfit = ordersList.reduce((sum, order) => sum + order.profit, 0);
    const totalRevenue = ordersList.reduce((sum, order) => sum + order.totalSaleRevenue, 0);
    const totalCost = ordersList.reduce((sum, order) => sum + order.totalPurchaseCost, 0);
    
    return {
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      orders: ordersList,
      summary: {
        totalOrders: ordersList.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        overallProfitMargin: totalRevenue > 0 
          ? parseFloat(((totalProfit / totalRevenue) * 100).toFixed(2))
          : 0
      }
    };
  }

  async getLowStockReport(threshold) {
    const lowStockItems = await getLowStockInventory(threshold);
    
    const itemsWithDetails = await Promise.all(
      lowStockItems.map(async (item) => {
        const productResult = await query(
          'SELECT description, sale_price FROM products WHERE sku = $1',
          [item.sku]
        );
        
        const product = productResult.rows[0];
        
        return {
          sku: item.sku,
          description: product?.description,
          quantity: item.quantity,
          location: item.locationName,
          salePrice: product ? parseFloat(product.sale_price) : 0,
          lastUpdated: item.lastUpdated
        };
      })
    );
    
    return {
      generatedAt: new Date(),
      threshold,
      items: itemsWithDetails,
      summary: {
        totalLowStockItems: itemsWithDetails.length
      }
    };
  }


  exportToCSV(report) {
    if (!report || !report.items) {
      throw new Error('Invalid report format for CSV export');
    }
    
    const items = report.items || report.transactions || report.orders;
    
    if (!items || items.length === 0) {
      return '';
    }
    
    const headers = Object.keys(items[0]);
    const csvRows = [];
    
    csvRows.push(headers.map(h => this.escapeCSVValue(h)).join(','));
    
    for (const item of items) {
      const values = headers.map(header => {
        const value = item[header];
        return this.escapeCSVValue(value);
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    const stringValue = String(value);
    
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }
}

module.exports = {
  ReportService
};
