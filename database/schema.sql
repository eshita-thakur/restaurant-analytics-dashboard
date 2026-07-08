-- =====================================================================
-- Restaurant Business Analytics Dashboard
-- Database: MySQL 8.0+
-- Phase 2: Normalized Schema (3NF)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS restaurant_analytics
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE restaurant_analytics;

-- =====================================================================
-- 1. ROLES  (RBAC lookup table)
-- =====================================================================
CREATE TABLE roles (
    role_id     INT AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- =====================================================================
-- 2. USERS  (login accounts)
-- =====================================================================
CREATE TABLE users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id       INT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users(role_id);

-- =====================================================================
-- 3. EMPLOYEES  (staff profile, optionally linked to a login)
-- =====================================================================
CREATE TABLE employees (
    employee_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NULL,
    first_name   VARCHAR(60) NOT NULL,
    last_name    VARCHAR(60) NOT NULL,
    phone        VARCHAR(20),
    position     VARCHAR(60) NOT NULL,
    salary       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hire_date    DATE NOT NULL,
    status       ENUM('active','on_leave','terminated') NOT NULL DEFAULT 'active',
    CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_employees_status ON employees(status);

-- =====================================================================
-- 4. CUSTOMERS
-- =====================================================================
CREATE TABLE customers (
    customer_id    INT AUTO_INCREMENT PRIMARY KEY,
    first_name     VARCHAR(60) NOT NULL,
    last_name      VARCHAR(60) NOT NULL,
    email          VARCHAR(120) UNIQUE,
    phone          VARCHAR(20) UNIQUE,
    address        VARCHAR(255),
    loyalty_points INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================================
-- 5. MENU CATEGORIES
-- =====================================================================
CREATE TABLE menu_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
) ENGINE=InnoDB;

-- =====================================================================
-- 6. MENU ITEMS
-- =====================================================================
CREATE TABLE menu_items (
    item_id      INT AUTO_INCREMENT PRIMARY KEY,
    category_id  INT NOT NULL,
    name         VARCHAR(120) NOT NULL,
    description  VARCHAR(255),
    price        DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    cost_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    image_url    VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menuitems_category FOREIGN KEY (category_id) REFERENCES menu_categories(category_id)
) ENGINE=InnoDB;

CREATE INDEX idx_menuitems_category ON menu_items(category_id);
CREATE INDEX idx_menuitems_available ON menu_items(is_available);

-- =====================================================================
-- 7. COUPONS
-- =====================================================================
CREATE TABLE coupons (
    coupon_id      INT AUTO_INCREMENT PRIMARY KEY,
    code           VARCHAR(30) NOT NULL UNIQUE,
    discount_type  ENUM('percentage','flat') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    valid_from     DATE NOT NULL,
    valid_to       DATE NOT NULL,
    usage_limit    INT NOT NULL DEFAULT 0,
    times_used     INT NOT NULL DEFAULT 0,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (valid_to >= valid_from)
) ENGINE=InnoDB;

-- =====================================================================
-- 8. ORDERS
-- =====================================================================
CREATE TABLE orders (
    order_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT NULL,
    employee_id  INT NOT NULL,
    coupon_id    INT NULL,
    order_type   ENUM('dine_in','takeaway','delivery') NOT NULL DEFAULT 'dine_in',
    status       ENUM('pending','preparing','served','completed','cancelled') NOT NULL DEFAULT 'pending',
    table_number VARCHAR(10),
    order_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_orders_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id),
    CONSTRAINT fk_orders_coupon   FOREIGN KEY (coupon_id)   REFERENCES coupons(coupon_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- =====================================================================
-- 9. ORDER ITEMS  (junction: orders <-> menu_items)
-- =====================================================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    item_id       INT NOT NULL,
    quantity      INT NOT NULL CHECK (quantity > 0),
    unit_price    DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    subtotal      DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_item  FOREIGN KEY (item_id)  REFERENCES menu_items(item_id)
) ENGINE=InnoDB;

CREATE INDEX idx_orderitems_order ON order_items(order_id);
CREATE INDEX idx_orderitems_item ON order_items(item_id);

-- =====================================================================
-- 10. PAYMENTS
-- =====================================================================
CREATE TABLE payments (
    payment_id       INT AUTO_INCREMENT PRIMARY KEY,
    order_id         INT NOT NULL,
    amount           DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method   ENUM('cash','card','upi','wallet') NOT NULL,
    payment_status   ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
    transaction_ref  VARCHAR(100),
    paid_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- =====================================================================
-- 11. RESERVATIONS
-- =====================================================================
CREATE TABLE reservations (
    reservation_id   INT AUTO_INCREMENT PRIMARY KEY,
    customer_id      INT NOT NULL,
    table_number     VARCHAR(10) NOT NULL,
    reservation_time DATETIME NOT NULL,
    party_size       INT NOT NULL CHECK (party_size > 0),
    status           ENUM('booked','seated','cancelled','no_show') NOT NULL DEFAULT 'booked',
    CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_reservations_time ON reservations(reservation_time);

-- =====================================================================
-- 12. SUPPLIERS
-- =====================================================================
CREATE TABLE suppliers (
    supplier_id    INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    contact_person VARCHAR(80),
    phone          VARCHAR(20),
    email          VARCHAR(120),
    address        VARCHAR(255)
) ENGINE=InnoDB;

-- =====================================================================
-- 13. INVENTORY
-- =====================================================================
CREATE TABLE inventory (
    inventory_id      INT AUTO_INCREMENT PRIMARY KEY,
    item_name         VARCHAR(120) NOT NULL,
    unit              VARCHAR(20) NOT NULL,           -- kg, litre, piece, etc.
    quantity_in_stock DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    reorder_level     DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost         DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    supplier_id       INT NULL,
    CONSTRAINT fk_inventory_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_inventory_supplier ON inventory(supplier_id);
CREATE INDEX idx_inventory_reorder ON inventory(quantity_in_stock, reorder_level);

-- =====================================================================
-- 14. PURCHASE ORDERS  (restaurant buys from supplier)
-- =====================================================================
CREATE TABLE purchase_orders (
    po_id         INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id   INT NOT NULL,
    order_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('draft','ordered','received','cancelled') NOT NULL DEFAULT 'draft',
    total_amount  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
) ENGINE=InnoDB;

CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

-- =====================================================================
-- 15. PURCHASE ORDER ITEMS  (junction: purchase_orders <-> inventory)
-- =====================================================================
CREATE TABLE purchase_order_items (
    po_item_id  INT AUTO_INCREMENT PRIMARY KEY,
    po_id       INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity    DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_cost   DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    CONSTRAINT fk_poitems_po        FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_poitems_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id)
) ENGINE=InnoDB;

CREATE INDEX idx_poitems_po ON purchase_order_items(po_id);

-- =====================================================================
-- 16. STOCK TRANSACTIONS  (immutable ledger of every stock movement)
-- =====================================================================
CREATE TABLE stock_transactions (
    transaction_id   INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id     INT NOT NULL,
    transaction_type ENUM('in','out','waste','adjustment') NOT NULL,
    quantity         DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    reference_type   VARCHAR(30),      -- 'purchase_order', 'order', 'manual'
    reference_id     INT,              -- id of the related po/order, nullable
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stocktx_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(inventory_id)
) ENGINE=InnoDB;

CREATE INDEX idx_stocktx_inventory ON stock_transactions(inventory_id);
CREATE INDEX idx_stocktx_date ON stock_transactions(created_at);
CREATE INDEX idx_stocktx_type ON stock_transactions(transaction_type);

-- =====================================================================
-- 17. FEEDBACK
-- =====================================================================
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id    INT NULL,
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(500),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_feedback_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================================
-- 18. EXPENSES
-- =====================================================================
CREATE TABLE expenses (
    expense_id   INT AUTO_INCREMENT PRIMARY KEY,
    category     VARCHAR(60) NOT NULL,     -- rent, utilities, salaries, maintenance...
    description  VARCHAR(255),
    amount       DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL,
    created_by   INT NULL,
    CONSTRAINT fk_expenses_employee FOREIGN KEY (created_by) REFERENCES employees(employee_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- =====================================================================
-- SEED DATA: default roles (required before any user can register)
-- =====================================================================
INSERT INTO roles (role_name, description) VALUES
('owner',   'Full system access'),
('manager', 'Operational access, no user management'),
('staff',   'Order and payment entry only');
