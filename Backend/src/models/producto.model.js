// ============================================
// src/models/producto.model.js
// Operaciones CRUD para la tabla `productos`
// ============================================
// Nota: el campo `precio` es DECIMAL(10,2).
// mysql2 devuelve DECIMAL como string para no perder precisión
// (ej: "15.50", no 15.5). Eso es correcto y esperado.
// ============================================

const { getPool } = require('../config/db');

const CAMPOS_SELECT = `
  p.id,
  p.codigo,
  p.nombre,
  p.descripcion,
  p.precio,
  p.stock,
  p.stock_minimo,
  p.categoria_id,
  c.nombre AS categoria_nombre,
  p.activo,
  p.created_at,
  p.updated_at
`;

/**
 * Lista productos con filtros opcionales.
 * @param {object} opciones
 * @param {boolean} opciones.incluirInactivos - si false, solo activos
 * @param {number}  opciones.categoria_id    - filtrar por categoría
 * @param {string}  opciones.busqueda        - buscar en nombre o código (LIKE)
 */
async function listar({ incluirInactivos = false, categoria_id = null, busqueda = null } = {}) {
  const pool = await getPool();
  const where = [];
  const params = [];

  if (!incluirInactivos) {
    where.push('p.activo = 1');
  }
  if (categoria_id != null) {
    where.push('p.categoria_id = ?');
    params.push(categoria_id);
  }
  if (busqueda && busqueda.trim() !== '') {
    where.push('(p.nombre LIKE ? OR p.codigo LIKE ?)');
    const q = `%${busqueda.trim()}%`;
    params.push(q, q);
  }

  const sql = `
    SELECT ${CAMPOS_SELECT}
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.id ASC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Obtiene un producto por ID. Devuelve null si no existe.
 */
async function obtenerPorId(id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT ${CAMPOS_SELECT}
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    WHERE p.id = ?
    `,
    [id]
  );
  return rows[0] || null;
}

/**
 * Obtiene un producto por código exacto. Útil para validar unicidad antes de crear.
 */
async function obtenerPorCodigo(codigo) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT ${CAMPOS_SELECT}
    FROM productos p
    INNER JOIN categorias c ON c.id = p.categoria_id
    WHERE p.codigo = ?
    `,
    [codigo]
  );
  return rows[0] || null;
}

/**
 * Crea un producto.
 * @param {object} datos - { codigo, nombre, descripcion, precio, stock, stock_minimo, categoria_id }
 * Lanza ER_DUP_ENTRY si el código ya existe.
 * Lanza ER_NO_REFERENCED_ROW_2 si la categoría no existe.
 */
async function crear({
  codigo,
  nombre,
  descripcion = null,
  precio,
  stock = 0,
  stock_minimo = 0,
  categoria_id
}) {
  const pool = await getPool();
  const [result] = await pool.query(
    `
    INSERT INTO productos
      (codigo, nombre, descripcion, precio, stock, stock_minimo, categoria_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [codigo, nombre, descripcion, precio, stock, stock_minimo, categoria_id]
  );
  return obtenerPorId(result.insertId);
}

/**
 * Actualiza un producto (sin tocar stock, que se gestiona en inventario/ventas).
 */
async function actualizar(id, {
  codigo,
  nombre,
  descripcion = null,
  precio,
  stock_minimo = 0,
  categoria_id
}) {
  const pool = await getPool();
  const [result] = await pool.query(
    `
    UPDATE productos
    SET codigo = ?, nombre = ?, descripcion = ?, precio = ?, stock_minimo = ?, categoria_id = ?
    WHERE id = ?
    `,
    [codigo, nombre, descripcion, precio, stock_minimo, categoria_id, id]
  );
  if (result.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/**
 * Actualiza SOLO el stock. La usan inventario y ventas dentro de transacciones.
 * No se debe llamar directamente desde un controlador: esas operaciones van
 * dentro de una transacción mayor en Fase 9 y 10.
 */
async function actualizarStock(id, nuevo_stock, conn = null) {
  const ejecutor = conn || await getPool();
  const [result] = await ejecutor.query(
    'UPDATE productos SET stock = ? WHERE id = ?',
    [nuevo_stock, id]
  );
  return result.affectedRows > 0;
}

/**
 * Desactiva un producto (soft delete). No se puede borrar si tiene ventas.
 */
async function desactivar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE productos SET activo = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Reactiva un producto.
 */
async function activar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE productos SET activo = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Elimina permanentemente un producto (Solo funciona si no tiene ventas/inventario)
 */
async function eliminar(id) {
  const pool = await getPool();
  const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorCodigo,
  crear,
  actualizar,
  actualizarStock,
  desactivar,
  activar
};
 