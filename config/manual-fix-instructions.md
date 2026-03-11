# Fix PostgreSQL Authentication

The error occurs because PostgreSQL is using "ident" authentication instead of password authentication.

## Option 1: Run the automated script

```bash
bash config/fix-pg-auth.sh
```

## Option 2: Manual fix

1. Edit the PostgreSQL configuration file:

```bash
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

2. Add these lines at the end of the file (before the default rules):

```
# Warehouse Management System - password authentication
local   warehouse_db    warehouse_user                  md5
host    warehouse_db    warehouse_user  127.0.0.1/32    md5
host    warehouse_db    warehouse_user  ::1/128         md5
```

3. Save and exit (Ctrl+X, then Y, then Enter)

4. Reload PostgreSQL:

```bash
sudo systemctl reload postgresql
```

5. Test the connection:

```bash
node config/init-db.js
```

## What this does

- Changes authentication method from "ident" (system user must match DB user) to "md5" (password-based)
- Applies only to the `warehouse_user` connecting to `warehouse_db`
- Allows connections from localhost
