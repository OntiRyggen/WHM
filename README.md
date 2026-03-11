# Warehouse Management System

A complete warehouse management system for small import firms with inventory tracking, shipment/order processing, and reporting capabilities.

## Overview

This system provides comprehensive warehouse operations management including:
- Multi-user role-based access control
- Real-time inventory tracking with location management
- Incoming shipment and outgoing order processing
- Automated profit calculations with price history tracking
- Detailed reporting and audit trails
- CSV export capabilities for all reports

## Features

- **Role-Based Access Control**: Manager and Warehouse Staff roles with different permissions
- **Product Management**: Create, update, and search products with automatic price history tracking
- **Inventory Tracking**: Real-time stock levels with warehouse location management
- **Shipment Processing**: Record incoming shipments and automatically update inventory
- **Order Processing**: Create outgoing orders with stock validation and automatic inventory deduction
- **Profit Calculations**: Automatic profit tracking using FIFO cost basis
- **Comprehensive Reporting**: Inventory, transactions, profit analysis, and low-stock alerts
- **Audit Logging**: Complete audit trail for all system operations
- **CSV Export**: Export all reports to CSV format for external analysis

## Quick Start

### Prerequisites

- Node.js (v16.0.0 or higher recommended, minimum v12.0.0)
- MySQL (v8.0 or higher)
- npm or yarn

**Note**: If you encounter `Cannot find module 'node:buffer'` errors with older Node.js versions, the package.json uses mysql2@2.3.3 for compatibility.

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/warehouse-management-system.git
cd warehouse-management-system
```

**2. Start MySQL**

```bash
sudo systemctl start mysql
```

**3. Create Database User and Database**

```bash
mysql -u root -p < config/create-user.sql
```

**4. Configure Environment**

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

**5. Install Dependencies**

```bash
npm install
```

**6. Setup Database (Initialize + Seed)**

```bash
npm run setup
```

This will create all tables and seed default users and locations.

**7. Run the Application**

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

The test suite includes:
- Unit tests for authentication and authorization
- Integration tests for API endpoints
- Property-based tests using fast-check for data validation
- Tests for shipment and order processing logic

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Database Configuration

The default configuration in `.env`:
- **Host**: `localhost`
- **Port**: `3306`
- **User**: `warehouse_user`
- **Password**: `warehouse_secure_pass_2024`
- **Database**: `warehouse_db`

You can modify these values in your `.env` file as needed.

## Security Notes

- Never commit your `.env` file to version control
- Change default passwords in production
- JWT tokens expire after 8 hours
- All passwords are hashed using bcrypt
- API endpoints are protected with JWT authentication middleware

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Testing**: Jest with fast-check for property-based testing
- **Frontend**: Vanilla JavaScript with responsive CSS

## Project Structure

```
warehouse-management-system/
├── config/              # Database setup and configuration scripts
├── public/              # Frontend HTML, CSS, and JavaScript
│   ├── css/            # Stylesheets
│   └── js/             # Client-side JavaScript modules
├── src/
│   ├── db/             # Database connection
│   ├── errors/         # Custom error classes
│   ├── middleware/     # Express middleware (auth, validation, error handling)
│   ├── models/         # Data models
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic layer
│   ├── app.js          # Express app configuration
│   └── server.js       # Server entry point
└── tests/              # Test suites
```
