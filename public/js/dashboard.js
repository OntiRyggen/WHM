const user = getUser();

async function loadDashboardStats() {
    try {
        // Load products - use empty search to get all products
        const products = await apiCall('/products/search?q=%20');
        document.getElementById('productCount').textContent = products.products.length;
        
        // Load inventory
        const inventory = await apiCall('/inventory');
        document.getElementById('inventoryCount').textContent = inventory.inventory.length;
        
        // Calculate low stock items (quantity <= 10)
        const lowStock = inventory.inventory.filter(item => item.quantity <= 10);
        document.getElementById('lowStockCount').textContent = lowStock.length;
        
        // Show low stock section if there are items
        if (lowStock.length > 0) {
            displayLowStockItems(lowStock);
        }
        
        // Calculate total inventory value (manager only)
        if (user.role === 'MANAGER') {
            let totalValue = 0;
            for (const item of inventory.inventory) {
                const product = products.products.find(p => p.sku === item.sku);
                if (product) {
                    totalValue += item.quantity * product.salePrice;
                }
            }
            document.getElementById('totalValue').textContent = totalValue.toFixed(2) + ' SEK';
        } else {
            document.getElementById('totalValueCard').style.display = 'none';
        }
        
        // Load recent activity
        await loadRecentActivity();
        
        // Hide reports action for non-managers
        if (user.role !== 'MANAGER') {
            document.getElementById('reportsAction').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Show error state
        document.getElementById('productCount').textContent = 'Error';
        document.getElementById('inventoryCount').textContent = 'Error';
        document.getElementById('lowStockCount').textContent = 'Error';
    }
}

async function loadRecentActivity() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const shipments = await apiCall('/shipments?startDate=' + sevenDaysAgo + '&endDate=' + today);
        const orders = await apiCall('/orders?startDate=' + sevenDaysAgo + '&endDate=' + today);
        
        const activities = [];
        
        shipments.shipments.forEach(s => {
            activities.push({
                type: 'shipment',
                date: new Date(s.createdAt),
                text: 'Shipment from ' + s.supplierName,
                id: s.shipmentId
            });
        });
        
        orders.orders.forEach(o => {
            activities.push({
                type: 'order',
                date: new Date(o.createdAt),
                text: 'Order for ' + o.customerName,
                id: o.orderId
            });
        });
        
        activities.sort((a, b) => b.date - a.date);
        
        const recentActivities = activities.slice(0, 10);
        
        if (recentActivities.length === 0) {
            document.getElementById('recentActivity').innerHTML = '<p>No recent activity</p>';
        } else {
            let html = '<ul class="activity-list">';
            recentActivities.forEach(activity => {
                const icon = activity.type === 'shipment' ? '📥' : '📤';
                const timeAgo = getTimeAgo(activity.date);
                html += '<li>';
                html += '<span class="activity-icon">' + icon + '</span>';
                html += '<span class="activity-text">' + activity.text + '</span>';
                html += '<span class="activity-time">' + timeAgo + '</span>';
                html += '</li>';
            });
            html += '</ul>';
            document.getElementById('recentActivity').innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        document.getElementById('recentActivity').innerHTML = '<p>Unable to load recent activity</p>';
    }
}

function displayLowStockItems(items) {
    const section = document.getElementById('lowStockSection');
    section.style.display = 'block';
    
    let html = '<table><thead><tr>';
    html += '<th>SKU</th><th>Quantity</th><th>Location</th>';
    html += '</tr></thead><tbody>';
    
    items.forEach(item => {
        const rowClass = item.quantity === 0 ? 'out-of-stock' : 'low-stock';
        html += '<tr class="' + rowClass + '">';
        html += '<td>' + item.sku + '</td>';
        html += '<td>' + item.quantity + '</td>';
        html += '<td>' + (item.locationName || 'N/A') + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    document.getElementById('lowStockItems').innerHTML = html;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
}

loadDashboardStats();
