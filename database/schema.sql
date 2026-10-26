-- ============================================
-- database/schema.sql
-- Esquema de la base de datos tienda_db (MySQL)
-- ============================================

CREATE DATABASE IF NOT EXISTS tienda_db
  DEFAULT CHARACTER SET = utf8mb4
  DEFAULT COLLATE = utf8mb4_unicode_ci;

USE tienda_db;

DROP TABLE IF EXISTS venta_detalle;
DROP TABLE IF EXISTS ventas;
DROP TABLE IF EXISTS inventario;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS roles;

-- ============================================
-- 1. roles
-- ============================================
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. usuarios
-- ============================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. categorias
-- ============================================
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. productos
-- ============================================
CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(500) NULL,
  precio DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  categoria_id INT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_productos_precio CHECK (precio >= 0),
  CONSTRAINT chk_productos_stock CHECK (stock >= 0),
  CONSTRAINT chk_productos_stock_minimo CHECK (stock_minimo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. inventario (movimientos)
-- ============================================
CREATE TABLE inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo ENUM('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  cantidad INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo INT NOT NULL,
  motivo VARCHAR(255) NULL,
  usuario_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventario_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_inventario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_inventario_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_inventario_stock CHECK (stock_anterior >= 0 AND stock_nuevo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. ventas
-- ============================================
CREATE TABLE ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_venta VARCHAR(30) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  impuesto DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  estado ENUM('COMPLETADA','ANULADA') NOT NULL DEFAULT 'COMPLETADA',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ventas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_ventas_totales CHECK (subtotal >= 0 AND impuesto >= 0 AND total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_ventas_created_at ON ventas(created_at);

-- ============================================
-- 7. venta_detalle
-- ============================================
CREATE TABLE venta_detalle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio CHECK (precio_unitario >= 0),
  CONSTRAINT chk_detalle_subtotal CHECK (subtotal >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DATOS SEMILLA
-- ============================================
INSERT INTO roles (nombre, descripcion) VALUES
  ('administrador', 'Acceso total al sistema'),
  ('vendedor',      'Registra ventas y consulta productos');

INSERT INTO categorias (nombre, descripcion) VALUES
  ('General', 'Categoría por defecto'),
  ('Bebidas', 'Bebidas y refrescos'),
  ('Snacks',  'Botanas y golosinas');