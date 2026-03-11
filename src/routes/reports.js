const express = require('express');
const { ReportService } = require('../services/ReportService');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();
const reportService = new ReportService();

router.get('/inventory', authenticateToken, requireManager, async (req, res) => {
  try {
    const report = await reportService.generateInventoryReport();
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/transactions', authenticateToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
    }
    const report = await reportService.generateTransactionReport(startDate, endDate);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/profit', authenticateToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
    }
    const report = await reportService.generateProfitReport(startDate, endDate);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/low-stock', authenticateToken, requireManager, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const report = await reportService.getLowStockReport(threshold);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/:type/export', authenticateToken, requireManager, async (req, res) => {
  try {
    let report;
    const { type } = req.params;
    const { startDate, endDate, threshold } = req.query;
    
    switch (type) {
      case 'inventory':
        report = await reportService.generateInventoryReport();
        break;
      case 'transactions':
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
        }
        report = await reportService.generateTransactionReport(startDate, endDate);
        break;
      case 'profit':
        if (!startDate || !endDate) {
          return res.status(400).json({ error: 'Missing parameters', message: 'startDate and endDate are required' });
        }
        report = await reportService.generateProfitReport(startDate, endDate);
        break;
      case 'low-stock':
        report = await reportService.getLowStockReport(parseInt(threshold) || 10);
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type', message: `Report type '${type}' is not supported` });
    }
    
    const csv = reportService.exportToCSV(report);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
