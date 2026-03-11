# Warehouse Management System

A complete warehouse management system for small import firms with inventory tracking, shipment/order processing, and reporting capabilities.

## Features

- Role-based access control (Manager & Warehouse Staff)
- Product management with price history
- Inventory tracking with location management
- Incoming shipment processing
- Outgoing order processing with stock validation
- Profit calculations and reporting
- Audit logging for all operations
- CSV export for reports

## Quick Start

### 1. Start PostgreSQL

```bash
sudo systemctl start postgresql
```

### 2. Create Database User and Database

```bash
sudo -u postgres psql -f config/create-user.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Setup Database (Initialize + Seed)

```bash
npm run setup
```

This will create all tables and seed default users and locations.

### 5. Run the Application

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Default Credentials

After seeding, you can login with:

- **Manager**: username=`manager`, password=`manager123`
- **Warehouse Staff**: username=`staff`, password=`staff123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products (Manager only for create/update)
- `POST /api/products` - Create product
- `PUT /api/products/:sku` - Update product
- `GET /api/products/search?q=query` - Search products
- `GET /api/products/:sku` - Get product details

### Inventory
- `GET /api/inventory` - Get all inventory
- `GET /api/inventory/:sku` - Get product inventory
- `PUT /api/inventory/:sku/location` - Move product location

### Shipments
- `POST /api/shipments` - Create incoming shipment
- `GET /api/shipments/:id` - Get shipment details
- `GET /api/shipments?startDate=&endDate=` - List shipments

### Orders
- `POST /api/orders` - Create outgoing order
- `GET /api/orders/:id?includeProfit=true` - Get order details
- `GET /api/orders?startDate=&endDate=` - List orders

### Reports (Manager only)
- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/transactions?startDate=&endDate=` - Transaction report
- `GET /api/reports/profit?startDate=&endDate=` - Profit report
- `GET /api/reports/low-stock?threshold=10` - Low stock report
- `GET /api/reports/:type/export` - Export report as CSV

### Audit Logs (Manager only)
- `GET /api/audit?userId=&startDate=&endDate=` - Get audit logs

## Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Database Configuration

The `.env` file contains:
- **User**: `warehouse_user`
- **Password**: `warehouse_secure_pass_2024`
- **Database**: `warehouse_db`

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens (8-hour expiration)
- **Testing**: Jest with fast-check for property-based testing
