-- Create database user for warehouse management system
CREATE USER warehouse_user WITH PASSWORD 'warehouse_secure_pass_2024';

-- Create the database
CREATE DATABASE warehouse_db OWNER warehouse_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE warehouse_db TO warehouse_user;

-- Connect to the database and grant schema privileges
\c warehouse_db
GRANT ALL ON SCHEMA public TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO warehouse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO warehouse_user;
