const user = getUser();

if (user.role !== 'MANAGER') {
    document.getElementById('createProductSection').style.display = 'none';
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productData = {
        sku: document.getElementById('sku').value,
        description: document.getElementById('description').value,
        purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
        salePrice: parseFloat(document.getElementById('salePrice').value)
    };
    
    try {
        await apiCall('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        showSuccess('productSuccess', 'Product created successfully!');
        document.getElementById('productForm').reset();
        searchProducts();
    } catch (error) {
        showError('productError', error.message);
    }
});

async function searchProducts() {
    const query = document.getElementById('searchQuery').value || '';
    
    try {
        const data = await apiCall(`/products/search?q=${encodeURIComponent(query)}`);
        displayProducts(data.products);
    } catch (error) {
        showError('productError', error.message);
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsTable');
    
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    
    const hidePricing = user.role !== 'MANAGER';
    
    let html = '<table><thead><tr>';
    html += '<th>SKU</th><th>Description</th>';
    if (!hidePricing) {
        html += '<th>Purchase Price</th><th>Sale Price</th>';
    }
    html += '</tr></thead><tbody>';
    
    products.forEach(product => {
        html += '<tr>';
        html += `<td>${product.sku}</td>`;
        html += `<td>${product.description}</td>`;
        if (!hidePricing) {
            html += `<td>${product.purchasePrice.toFixed(2)} SEK</td>`;
            html += `<td>${product.salePrice.toFixed(2)} SEK</td>`;
        }
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

searchProducts();
