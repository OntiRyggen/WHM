let currentInventory = [];

async function loadInventory() {
    try {
        const data = await apiCall('/inventory');
        currentInventory = data.inventory;
        displayInventory(currentInventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        alert('Failed to load inventory: ' + error.message);
    }
}

function displayInventory(inventory) {
    const container = document.getElementById('inventoryTable');
    
    if (inventory.length === 0) {
        container.innerHTML = '<p>No inventory records found.</p>';
        return;
    }
    
    let html = '<table><thead><tr>';
    html += '<th>SKU</th>';
    html += '<th>Quantity</th>';
    html += '<th>Location</th>';
    html += '<th>Last Updated</th>';
    html += '<th>Actions</th>';
    html += '</tr></thead><tbody>';
    
    inventory.forEach(item => {
        const lastUpdated = new Date(item.lastUpdated).toLocaleString();
        const stockClass = item.quantity === 0 ? 'out-of-stock' : (item.quantity < 10 ? 'low-stock' : '');
        
        html += `<tr class="${stockClass}">`;
        html += `<td>${item.sku}</td>`;
        html += `<td>${item.quantity}</td>`;
        html += `<td>${item.locationName || 'N/A'}</td>`;
        html += `<td>${lastUpdated}</td>`;
        html += `<td><button onclick="openMoveModal('${item.sku}', '${item.locationName || ''}')" class="btn btn-secondary btn-sm">Move</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function openMoveModal(sku, currentLocation) {
    document.getElementById('moveSku').value = sku;
    document.getElementById('currentLocation').value = currentLocation;
    document.getElementById('newLocation').value = '';
    document.getElementById('moveLocationModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('moveLocationModal').style.display = 'none';
}

document.getElementById('moveLocationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sku = document.getElementById('moveSku').value;
    const newLocation = document.getElementById('newLocation').value;
    
    try {
        await apiCall(`/inventory/${sku}/location`, {
            method: 'PUT',
            body: JSON.stringify({ location: newLocation })
        });
        
        showSuccess('moveSuccess', 'Location updated successfully!');
        setTimeout(() => {
            closeModal();
            loadInventory();
        }, 1500);
    } catch (error) {
        showError('moveError', error.message);
    }
});

async function showLowStock() {
    const lowStock = currentInventory.filter(item => item.quantity <= 10);
    displayInventory(lowStock);
}

window.onclick = function(event) {
    const modal = document.getElementById('moveLocationModal');
    if (event.target === modal) {
        closeModal();
    }
}

loadInventory();
