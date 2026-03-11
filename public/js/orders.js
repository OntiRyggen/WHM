const user = getUser();

// Set default dates
const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

document.getElementById('orderDate').value = today;
document.getElementById('startDate').value = thirtyDaysAgo;
document.getElementById('endDate').value = today;

function addOrderItem() {
    const container = document.getElementById('orderItems');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <div class="form-group">
            <label>SKU *</label>
            <input type="text" class="item-sku" required>
        </div>
        <div class="form-group">
            <label>Quantity *</label>
            <input type="number" class="item-quantity" min="1" required>
        </div>
        <button type="button" onclick="removeOrderItem(this)" class="btn btn-danger btn-sm">Remove</button>
    `;
    container.appendChild(itemRow);
}

function removeOrderItem(button) {
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length > 1) {
        button.parentElement.remove();
    } else {
        alert('At least one item is required');
    }
}

document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerName = document.getElementById('customerName').value;
    const orderDate = document.getElementById('orderDate').value;
    
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const sku = row.querySelector('.item-sku').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        items.push({ sku, quantity });
    });
    
    const orderData = {
        customerName,
        orderDate,
        items
    };
    
    try {
        const result = await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        showSuccess('orderSuccess', `Order created successfully! ID: ${result.order.orderId}`);
        document.getElementById('orderForm').reset();
        document.getElementById('orderDate').value = today;
        
        // Reset to single item
        const container = document.getElementById('orderItems');
        container.innerHTML = `
            <div class="item-row">
                <div class="form-group">
                    <label>SKU *</label>
                    <input type="text" class="item-sku" required>
                </div>
                <div class="form-group">
                    <label>Quantity *</label>
                    <input type="number" class="item-quantity" min="1" required>
                </div>
                <button type="button" onclick="removeOrderItem(this)" class="btn btn-danger btn-sm">Remove</button>
            </div>
        `;
        
        loadOrders();
    } catch (error) {
        showError('orderError', error.message);
    }
});

async function loadOrders() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        const data = await apiCall(`/orders?startDate=${startDate}&endDate=${endDate}`);
        displayOrders(data.orders);
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('orderError', error.message);
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersTable');
    
    if (orders.length === 0) {
        container.innerHTML = '<p>No orders found for the selected date range.</p>';
        return;
    }
    
    const isManager = user.role === 'MANAGER';
    
    let html = '<table><thead><tr>';
    html += '<th>Order ID</th>';
    html += '<th>Customer</th>';
    html += '<th>Order Date</th>';
    html += '<th>Items</th>';
    if (isManager) {
        html += '<th>Actions</th>';
    }
    html += '</tr></thead><tbody>';
    
    orders.forEach(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const itemsCount = order.items ? order.items.length : 0;
        
        html += '<tr>';
        html += `<td>${order.orderId}</td>`;
        html += `<td>${order.customerName}</td>`;
        html += `<td>${orderDate}</td>`;
        html += `<td>${itemsCount} item(s)</td>`;
        if (isManager) {
            html += `<td><button onclick="viewOrderProfit('${order.orderId}')" class="btn btn-secondary btn-sm">View Profit</button></td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function viewOrderProfit(orderId) {
    try {
        const data = await apiCall(`/orders/${orderId}?includeProfit=true`);
        const order = data.order;
        
        let message = `Order: ${order.orderId}\n`;
        message += `Customer: ${order.customerName}\n\n`;
        message += `Total Purchase Cost: ${order.totalPurchaseCost.toFixed(2)} SEK\n`;
        message += `Total Sale Revenue: ${order.totalSaleRevenue.toFixed(2)} SEK\n`;
        message += `Profit: ${order.profit.toFixed(2)} SEK\n`;
        message += `Profit Margin: ${order.profitMargin}%`;
        
        alert(message);
    } catch (error) {
        alert('Error loading profit data: ' + error.message);
    }
}

loadOrders();
