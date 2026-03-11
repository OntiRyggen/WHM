const user = getUser();

// Check if user is manager
if (user.role !== 'MANAGER') {
    alert('Access denied. Reports are only available to managers.');
    window.location.href = '/dashboard.html';
}

// Set default dates
const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

document.getElementById('transStartDate').value = thirtyDaysAgo;
document.getElementById('transEndDate').value = today;
document.getElementById('profitStartDate').value = thirtyDaysAgo;
document.getElementById('profitEndDate').value = today;

async function generateInventoryReport() {
    try {
        const data = await apiCall('/reports/inventory');
        displayInventoryReport(data.report);
    } catch (error) {
        alert('Error generating report: ' + error.message);
    }
}

function displayInventoryReport(report) {
    document.getElementById('reportTitle').textContent = 'Inventory Report';
    
    let html = '<div class="report-summary">';
    html += `<p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>`;
    html += `<p><strong>Total Products:</strong> ${report.summary.totalProducts}</p>`;
    html += `<p><strong>Total Value:</strong> ${report.summary.totalValue.toFixed(2)} SEK</p>`;
    html += '</div>';
    
    html += '<table><thead><tr>';
    html += '<th>SKU</th><th>Description</th><th>Quantity</th><th>Location</th><th>Sale Price</th><th>Value</th>';
    html += '</tr></thead><tbody>';
    
    report.items.forEach(item => {
        html += '<tr>';
        html += `<td>${item.sku}</td>`;
        html += `<td>${item.description}</td>`;
        html += `<td>${item.quantity}</td>`;
        html += `<td>${item.location || 'N/A'}</td>`;
        html += `<td>${item.salePrice.toFixed(2)} SEK</td>`;
        html += `<td>${item.value.toFixed(2)} SEK</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportResults').style.display = 'block';
}

async function generateTransactionReport() {
    const startDate = document.getElementById('transStartDate').value;
    const endDate = document.getElementById('transEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        const data = await apiCall(`/reports/transactions?startDate=${startDate}&endDate=${endDate}`);
        displayTransactionReport(data.report);
    } catch (error) {
        alert('Error generating report: ' + error.message);
    }
}

function displayTransactionReport(report) {
    document.getElementById('reportTitle').textContent = 'Transaction Report';
    
    let html = '<div class="report-summary">';
    html += `<p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>`;
    html += `<p><strong>Period:</strong> ${report.dateRange.startDate} to ${report.dateRange.endDate}</p>`;
    html += `<p><strong>Total Transactions:</strong> ${report.summary.totalTransactions}</p>`;
    html += `<p><strong>Incoming:</strong> ${report.summary.incomingCount} (${report.summary.totalIncomingQuantity} units)</p>`;
    html += `<p><strong>Outgoing:</strong> ${report.summary.outgoingCount} (${report.summary.totalOutgoingQuantity} units)</p>`;
    html += '</div>';
    
    html += '<table><thead><tr>';
    html += '<th>Type</th><th>Reference ID</th><th>SKU</th><th>Quantity</th><th>Party</th><th>Date</th>';
    html += '</tr></thead><tbody>';
    
    report.transactions.forEach(trans => {
        const date = new Date(trans.transactionDate).toLocaleDateString();
        html += '<tr>';
        html += `<td><span class="badge ${trans.type === 'INCOMING' ? 'badge-success' : 'badge-warning'}">${trans.type}</span></td>`;
        html += `<td>${trans.referenceId}</td>`;
        html += `<td>${trans.sku}</td>`;
        html += `<td>${trans.quantity}</td>`;
        html += `<td>${trans.partyName || 'N/A'}</td>`;
        html += `<td>${date}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportResults').style.display = 'block';
}

async function generateProfitReport() {
    const startDate = document.getElementById('profitStartDate').value;
    const endDate = document.getElementById('profitEndDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        const data = await apiCall(`/reports/profit?startDate=${startDate}&endDate=${endDate}`);
        displayProfitReport(data.report);
    } catch (error) {
        alert('Error generating report: ' + error.message);
    }
}

function displayProfitReport(report) {
    document.getElementById('reportTitle').textContent = 'Profit Report';
    
    let html = '<div class="report-summary profit-summary">';
    html += `<p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>`;
    html += `<p><strong>Period:</strong> ${report.dateRange.startDate} to ${report.dateRange.endDate}</p>`;
    html += `<p><strong>Total Orders:</strong> ${report.summary.totalOrders}</p>`;
    html += `<p class="highlight"><strong>Total Revenue:</strong> ${report.summary.totalRevenue.toFixed(2)} SEK</p>`;
    html += `<p><strong>Total Cost:</strong> ${report.summary.totalCost.toFixed(2)} SEK</p>`;
    html += `<p class="highlight profit"><strong>Total Profit:</strong> ${report.summary.totalProfit.toFixed(2)} SEK</p>`;
    html += `<p><strong>Profit Margin:</strong> ${report.summary.overallProfitMargin}%</p>`;
    html += '</div>';
    
    html += '<table><thead><tr>';
    html += '<th>Order ID</th><th>Customer</th><th>Date</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th>';
    html += '</tr></thead><tbody>';
    
    report.orders.forEach(order => {
        const date = new Date(order.orderDate).toLocaleDateString();
        html += '<tr>';
        html += `<td>${order.orderId}</td>`;
        html += `<td>${order.customerName}</td>`;
        html += `<td>${date}</td>`;
        html += `<td>${order.totalSaleRevenue.toFixed(2)} SEK</td>`;
        html += `<td>${order.totalPurchaseCost.toFixed(2)} SEK</td>`;
        html += `<td>${order.profit.toFixed(2)} SEK</td>`;
        html += `<td>${order.profitMargin}%</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportResults').style.display = 'block';
}

async function generateLowStockReport() {
    const threshold = document.getElementById('threshold').value;
    
    try {
        const data = await apiCall(`/reports/low-stock?threshold=${threshold}`);
        displayLowStockReport(data.report);
    } catch (error) {
        alert('Error generating report: ' + error.message);
    }
}

function displayLowStockReport(report) {
    document.getElementById('reportTitle').textContent = 'Low Stock Report';
    
    let html = '<div class="report-summary">';
    html += `<p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>`;
    html += `<p><strong>Threshold:</strong> ${report.threshold} units</p>`;
    html += `<p><strong>Low Stock Items:</strong> ${report.summary.totalLowStockItems}</p>`;
    html += '</div>';
    
    if (report.items.length === 0) {
        html += '<p>No low stock items found.</p>';
    } else {
        html += '<table><thead><tr>';
        html += '<th>SKU</th><th>Description</th><th>Quantity</th><th>Location</th><th>Sale Price</th>';
        html += '</tr></thead><tbody>';
        
        report.items.forEach(item => {
            const rowClass = item.quantity === 0 ? 'out-of-stock' : 'low-stock';
            html += `<tr class="${rowClass}">`;
            html += `<td>${item.sku}</td>`;
            html += `<td>${item.description}</td>`;
            html += `<td>${item.quantity}</td>`;
            html += `<td>${item.location || 'N/A'}</td>`;
            html += `<td>$${item.salePrice.toFixed(2)}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    }
    
    document.getElementById('reportContent').innerHTML = html;
    document.getElementById('reportResults').style.display = 'block';
}

async function exportReport(type) {
    let url = `/reports/${type}/export`;
    
    if (type === 'transactions') {
        const startDate = document.getElementById('transStartDate').value;
        const endDate = document.getElementById('transEndDate').value;
        if (!startDate || !endDate) {
            alert('Please select date range first');
            return;
        }
        url += `?startDate=${startDate}&endDate=${endDate}`;
    } else if (type === 'profit') {
        const startDate = document.getElementById('profitStartDate').value;
        const endDate = document.getElementById('profitEndDate').value;
        if (!startDate || !endDate) {
            alert('Please select date range first');
            return;
        }
        url += `?startDate=${startDate}&endDate=${endDate}`;
    } else if (type === 'low-stock') {
        const threshold = document.getElementById('threshold').value;
        url += `?threshold=${threshold}`;
    }
    
    const token = getToken();
    window.open(`${url}&token=${token}`, '_blank');
}

function closeReport() {
    document.getElementById('reportResults').style.display = 'none';
}
