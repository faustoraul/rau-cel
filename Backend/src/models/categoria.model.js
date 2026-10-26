// ============================================
// src/models/categoria.model.js
// Operaciones CRUD para la tabla `categorias`
// ============================================

const { getPool } = require('../config/db');

/**
 * Lista todas las categorías activas.
 * Si `incluirInactivas` es true, devuelve todas.
 */
async function listar({ incluirInactivas = false } = {}) {
  const pool = await getPool();
  const sql = incluirInactivas
    ? 'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM categorias ORDER BY id ASC'
    : 'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM categorias WHERE activo = 1 ORDER BY id ASC';
  const [rows] = await pool.query(sql);
  return rows;
}

/**
 * Obtiene una categoría por ID. Devuelve null si no existe.
 */
async function obtenerPorId(id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, activo, created_at, updated_at FROM categorias WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Crea una categoría. Devuelve la categoría creada.
 */
async function crear({ nombre, descripcion = null }) {
  const pool = await getPool();
  const [result] = await pool.query(
    'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion]
  );
  return obtenerPorId(result.insertId);
}

/**
 * Actualiza una categoría existente. Devuelve la categoría actualizada o null.
 */
async function actualizar(id, { nombre, descripcion = null }) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
    [nombre, descripcion, id]
  );
  if (result.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/**
 * Desactiva una categoría (soft delete). No se puede "eliminar" si tiene productos.
 * Devuelve true si se desactivó, false si no existía.
 */
async function desactivar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE categorias SET activo = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Reactiva una categoría previamente desactivada.
 */
async function activar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE categorias SET activo = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  desactivar,
  activar
};