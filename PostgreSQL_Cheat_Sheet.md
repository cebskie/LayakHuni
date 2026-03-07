# PostgreSQL Essential Queries Cheat Sheet

## Database Management

### List all databases
```sql
\l
-- or
SELECT datname FROM pg_database WHERE datistemplate = false;
```

### Create a database
```sql
CREATE DATABASE database_name;
```

### Drop a database
```sql
DROP DATABASE database_name;
-- Force drop (even if connections exist)
DROP DATABASE IF EXISTS database_name;
```

### Switch to a database
```sql
\c database_name
```

### Show current database
```sql
SELECT current_database();
```

---

## Table Management

### List all tables
```sql
\dt
-- or with schema info
\dt *.*
-- or detailed
SELECT * FROM information_schema.tables WHERE table_schema = 'public';
```

### Show table structure / describe table
```sql
\d table_name
-- or
DESC table_name;
-- or detailed columns
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'table_name';
```

### Create a table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Drop a table
```sql
DROP TABLE table_name;
-- Drop if exists (won't error if table doesn't exist)
DROP TABLE IF EXISTS table_name;
```

### Truncate a table (delete all rows, fast)
```sql
TRUNCATE TABLE table_name;
-- Reset auto-increment
TRUNCATE TABLE table_name RESTART IDENTITY;
```

---

## Alter Table (Modify Structure)

### Add a column
```sql
ALTER TABLE table_name ADD COLUMN column_name data_type;
```

### Drop a column
```sql
ALTER TABLE table_name DROP COLUMN column_name;
```

### Rename a column
```sql
ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
```

### Modify column data type
```sql
ALTER TABLE table_name ALTER COLUMN column_name TYPE new_data_type;
```

### Add a constraint
```sql
ALTER TABLE table_name ADD CONSTRAINT constraint_name UNIQUE (column_name);
ALTER TABLE table_name ADD PRIMARY KEY (column_name);
ALTER TABLE table_name ADD FOREIGN KEY (column_name) REFERENCES other_table(id);
```

### Drop a constraint
```sql
ALTER TABLE table_name DROP CONSTRAINT constraint_name;
```

### Rename a table
```sql
ALTER TABLE old_table_name RENAME TO new_table_name;
```

---

## Select Queries (Data Retrieval)

### Select all columns from a table
```sql
SELECT * FROM table_name;
```

### Select specific columns
```sql
SELECT column1, column2 FROM table_name;
```

### Select with WHERE clause (filtering)
```sql
SELECT * FROM users WHERE email = 'user@example.com';
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE name LIKE '%john%';
```

### Select with ORDER BY (sorting)
```sql
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY name ASC;
```

### Select with LIMIT and OFFSET (pagination)
```sql
SELECT * FROM users LIMIT 10;
SELECT * FROM users LIMIT 10 OFFSET 20;  -- Skip first 20, get next 10
```

### Select with COUNT, SUM, AVG, MIN, MAX (aggregates)
```sql
SELECT COUNT(*) FROM users;
SELECT SUM(amount) FROM orders;
SELECT AVG(age) FROM users;
SELECT MIN(price), MAX(price) FROM products;
```

### Select with GROUP BY
```sql
SELECT category, COUNT(*) FROM products GROUP BY category;
```

### Select with JOIN
```sql
SELECT users.name, orders.id 
FROM users 
INNER JOIN orders ON users.id = orders.user_id;

SELECT users.name, orders.id 
FROM users 
LEFT JOIN orders ON users.id = orders.user_id;
```

### Select DISTINCT (remove duplicates)
```sql
SELECT DISTINCT city FROM users;
```

---

## Insert, Update, Delete (Data Modification)

### Insert one row
```sql
INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
```

### Insert multiple rows
```sql
INSERT INTO users (name, email) VALUES 
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Johnson', 'bob@example.com');
```

### Update rows
```sql
UPDATE users SET email = 'newemail@example.com' WHERE id = 1;
UPDATE users SET age = age + 1 WHERE name = 'John';
```

### Delete rows
```sql
DELETE FROM users WHERE id = 1;
DELETE FROM users WHERE email LIKE '%@oldomain.com';
```

### Delete all rows (slow but safe)
```sql
DELETE FROM users;
```

---

## Useful Information Queries

### Show all columns in a table
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Show all constraints
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';
```

### Show current user
```sql
SELECT current_user;
```

### Show current timestamp
```sql
SELECT CURRENT_TIMESTAMP;
```

### Check database size
```sql
SELECT pg_size_pretty(pg_database_size('database_name'));
```

### Show table size
```sql
SELECT pg_size_pretty(pg_total_relation_size('table_name'));
```

---

## Useful Psql Commands (starts with \)

| Command | Description |
|---------|-------------|
| `\l` | List all databases |
| `\c database_name` | Connect to a database |
| `\dt` | List all tables |
| `\d table_name` | Describe table structure |
| `\du` | List all users/roles |
| `\dn` | List all schemas |
| `\df` | List all functions |
| `\h` | Help on SQL commands |
| `\h SELECT` | Help on specific command (e.g., SELECT) |
| `\q` | Quit psql |
| `\i filename.sql` | Execute SQL from file |

---

## Data Types

| Type | Description | Example |
|------|-------------|---------|
| `SERIAL` | Auto-incrementing integer | `SERIAL PRIMARY KEY` |
| `UUID` | Universally unique identifier | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| `VARCHAR(n)` | Variable-length string | `VARCHAR(100)` |
| `TEXT` | Large text | `TEXT` |
| `INT` | Integer | `INT` |
| `BIGINT` | Large integer | `BIGINT` |
| `DECIMAL(p,s)` | Decimal number | `DECIMAL(10,2)` |
| `BOOLEAN` | True/False | `BOOLEAN` |
| `TIMESTAMP` | Date and time | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` |
| `DATE` | Date only | `DATE` |
| `TIME` | Time only | `TIME` |
| `JSON` | JSON data | `JSON` |
| `JSONB` | Binary JSON (faster) | `JSONB` |
| `ARRAY` | Array type | `VARCHAR[]` or `INT[]` |

---

## Tips & Tricks

### View your query results as a table (in psql)
```sql
\x  -- Toggle expanded display
```

### Time a query
```sql
\timing on
SELECT * FROM large_table;
\timing off
```

### Export query results to CSV
```bash
psql -U username -d database_name -c "SELECT * FROM table_name;" > output.csv
```

### Import from CSV
```sql
COPY table_name(col1, col2) FROM '/path/to/file.csv' DELIMITER ',' CSV HEADER;
```

### Check for duplicate values
```sql
SELECT column_name, COUNT(*) 
FROM table_name 
GROUP BY column_name 
HAVING COUNT(*) > 1;
```

### Find NULL values
```sql
SELECT * FROM table_name WHERE column_name IS NULL;
```
