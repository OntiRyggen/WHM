#!/bin/bash

# Script to fix PostgreSQL authentication for warehouse_user

echo "Backing up pg_hba.conf..."
sudo cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup

echo "Adding password authentication for warehouse_user..."
sudo bash -c 'cat >> /var/lib/pgsql/data/pg_hba.conf << EOF

# Warehouse Management System - password authentication
local   warehouse_db    warehouse_user                  md5
host    warehouse_db    warehouse_user  127.0.0.1/32    md5
host    warehouse_db    warehouse_user  ::1/128         md5
EOF'

echo "Reloading PostgreSQL configuration..."
sudo systemctl reload postgresql

echo "Done! You can now connect with password authentication."
echo "Try running: node config/init-db.js"
