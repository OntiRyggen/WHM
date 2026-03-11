-- Warehouse Management System Database Schema (MySQL)

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
) ENGINE=InnoDB;

-- Products table
CREATE TABLE products (
  sku VARCHAR(50) PRIMARY KEY,
  description TEXT NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT
) ENGINE=InnoDB;

-- Price history table
CREATE TABLE price_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50),
  previous_purchase_price DECIMAL(10, 2),
  new_purchase_price DECIMAL(10, 2),
  previous_sale_price DECIMAL(10, 2),
  new_sale_price DECIMAL(10, 2),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INT
) ENGINE=InnoDB;

-- Locations table
CREATE TABLE locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
) ENGINE=InnoDB;

-- Inventory table
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) UNIQUE,
  quantity INT NOT NULL DEFAULT 0,
  location_id INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INT
) ENGINE=InnoDB;

-- Shipments table
CREATE TABLE shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  arrival_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT
) ENGINE=InnoDB;

-- Shipment items table
CREATE TABLE shipment_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shipment_id VARCHAR(50),
  sku VARCHAR(50),
  quantity INT NOT NULL
) ENGINE=InnoDB;

-- Orders table
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  order_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT
) ENGINE=InnoDB;

-- Order items table
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50),
  sku VARCHAR(50),
  quantity INT NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB;

-- Transactions table
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL,
  reference_id VARCHAR(50) NOT NULL,
  sku VARCHAR(50),
  quantity INT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INT
) ENGINE=InnoDB;

-- Audit logs table
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  affected_table VARCHAR(50) NOT NULL,
  affected_id VARCHAR(50),
  old_values TEXT,
  new_values TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Indexes for performance optimization
CREATE INDEX idx_products_description ON products(description(255));
CREATE INDEX idx_inventory_sku ON inventory(sku);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX idx_shipments_arrival_date ON shipments(arrival_date);
CREATE INDEX idx_orders_order_date ON orders(order_date);
