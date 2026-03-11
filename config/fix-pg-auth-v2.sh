#!/bin/bash

# Script to properly fix PostgreSQL authentication for warehouse_user
# Rules must be placed BEFORE the default "local all all" rule

echo "Creating new pg_hba.conf with correct rule order..."

# Create a temporary file with warehouse rules inserted before default rules
sudo awk '
/^local[[:space:]]+all[[:space:]]+all/ {
    if (!inserted) {
        print "# Warehouse Management System - password authentication"
        print "local   warehouse_db    warehouse_user                  md5"
        print "host    warehouse_db    warehouse_user  127.0.0.1/32    md5"
        print "host    warehouse_db    warehouse_user  ::1/128         md5"
        print ""
        inserted = 1
    }
}
!/^# Warehouse Management System/ && !/^local[[:space:]]+warehouse_db/ && !/^host[[:space:]]+warehouse_db[[:space:]]+warehouse_user/ {
    print
}
' /var/lib/pgsql/data/pg_hba.conf > /tmp/pg_hba_new.conf

echo "Backing up original pg_hba.conf..."
sudo cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup2

echo "Installing new pg_hba.conf..."
sudo mv /tmp/pg_hba_new.conf /var/lib/pgsql/data/pg_hba.conf
sudo chown postgres:postgres /var/lib/pgsql/data/pg_hba.conf
sudo chmod 600 /var/lib/pgsql/data/pg_hba.conf

echo "Restarting PostgreSQL..."
sudo systemctl restart postgresql

echo "Done! Testing connection..."
sleep 2
node config/init-db.js
