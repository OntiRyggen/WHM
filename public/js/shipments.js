// Set default dates
const today = new Date().toISOString().split('T')[0];
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

document.getElementById('arrivalDate').value = today;
document.getElementById('startDate').value = thirtyDaysAgo;
document.getElementById('endDate').value = today;

function addItem() {
    const container = document.getElementById('shipmentItems');
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
        <button type="button" onclick="removeItem(this)" class="btn btn-danger btn-sm">Remove</button>
    `;
    container.appendChild(itemRow);
}

function removeItem(button) {
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length > 1) {
        button.parentElement.remove();
    } else {
        alert('At least one item is required');
    }
}

document.getElementById('shipmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const supplierName = document.getElementById('supplierName').value;
    const arrivalDate = document.getElementById('arrivalDate').value;
    
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const sku = row.querySelector('.item-sku').value;
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        items.push({ sku, quantity });
    });
    
    const shipmentData = {
        supplierName,
        arrivalDate,
        items
    };
    
    try {
        const result = await apiCall('/shipments', {
            method: 'POST',
            body: JSON.stringify(shipmentData)
        });
        
        showSuccess('shipmentSuccess', `Shipment created successfully! ID: ${result.shipment.shipmentId}`);
        document.getElementById('shipmentForm').reset();
        document.getElementById('arrivalDate').value = today;
        
        // Reset to single item
        const container = document.getElementById('shipmentItems');
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
                <button type="button" onclick="removeItem(this)" class="btn btn-danger btn-sm">Remove</button>
            </div>
        `;
        
        loadShipments();
    } catch (error) {
        showError('shipmentError', error.message);
    }
});

async function loadShipments() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates');
        return;
    }
    
    try {
        const data = await apiCall(`/shipments?startDate=${startDate}&endDate=${endDate}`);
        displayShipments(data.shipments);
    } catch (error) {
        console.error('Error loading shipments:', error);
        showError('shipmentError', error.message);
    }
}

function displayShipments(shipments) {
    const container = document.getElementById('shipmentsTable');
    
    if (shipments.length === 0) {
        container.innerHTML = '<p>No shipments found for the selected date range.</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    html += '<th>Shipment ID</th>';
    html += '<th>Supplier</th>';
    html += '<th>Arrival Date</th>';
    html += '<th>Items</th>';
    html += '<th>Created</th>';
    html += '</tr></thead><tbody>';
    
    shipments.forEach(shipment => {
        const arrivalDate = new Date(shipment.arrivalDate).toLocaleDateString();
        const createdAt = new Date(shipment.createdAt).toLocaleString();
        const itemsCount = shipment.items ? shipment.items.length : 0;
        
        html += '<tr>';
        html += `<td>${shipment.shipmentId}</td>`;
        html += `<td>${shipment.supplierName}</td>`;
        html += `<td>${arrivalDate}</td>`;
        html += `<td>${itemsCount} item(s)</td>`;
        html += `<td>${createdAt}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

loadShipments();
