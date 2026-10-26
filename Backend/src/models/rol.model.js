// ============================================
// src/models/rol.model.js
// Operaciones CRUD para la tabla `roles`
// ============================================

const { getPool } = require('../config/db');

/**
 * Lista todos los roles (no hay "activo" en roles, son fijos).
 */
async function listar() {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, created_at FROM roles ORDER BY id ASC'
  );
  return rows;
}

/**
 * Obtiene un rol por su ID. Devuelve null si no existe.
 */
async function obtenerPorId(id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, created_at FROM roles WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

/**
 * Obtiene un rol por su nombre (útil para el login / permisos).
 */
async function obtenerPorNombre(nombre) {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion, created_at FROM roles WHERE nombre = ?',
    [nombre]
  );
  return rows[0] || null;
}

/**
 * Crea un rol nuevo. Devuelve el rol creado.
 */
async function crear({ nombre, descripcion = null }) {
  const pool = await getPool();
  const [result] = await pool.query(
    'INSERT INTO roles (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion]
  );
  return { id: result.insertId, nombre, descripcion };
}

/**
 * Actualiza un rol existente. Devuelve el rol actualizado o null si no existe.
 */
async function actualizar(id, { nombre, descripcion = null }) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE roles SET nombre = ?, descripcion = ? WHERE id = ?',
    [nombre, descripcion, id]
  );
  if (result.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/**
 * Elimina un rol. Solo funcionará si no tiene usuarios asociados (FK RESTRICT).
 * Devuelve true si se eliminó, false si no existía.
 */
async function eliminar(id) {
  const pool = await getPool();
  const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorNombre,
  crear,
  actualizar,
  eliminar
};