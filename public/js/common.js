const API_BASE = '/api';

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

async function apiCall(endpoint, options = {}) {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        clearToken();
        window.location.href = '/';
        return;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }
    
    return data;
}

function logout() {
    clearToken();
    window.location.href = '/';
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

function updateUserInfo() {
    const user = getUser();
    if (user) {
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `${user.username} (${user.role})`;
        }
        
        if (user.role !== 'MANAGER') {
            const reportsLink = document.getElementById('reportsLink');
            if (reportsLink) {
                reportsLink.style.display = 'none';
            }
        }
    }
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 5000);
    }
}

function showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }
}

if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    if (checkAuth()) {
        updateUserInfo();
    }
}
