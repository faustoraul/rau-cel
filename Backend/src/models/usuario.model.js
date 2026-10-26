// ============================================
// src/models/usuario.model.js
// Operaciones CRUD para la tabla `usuarios`
// ============================================
// Nota: este modelo NO hashea contraseñas.
// El hash se hace en la capa de auth (Fase 6) antes de llamar a crear().
// Aquí solo recibimos `password_hash` ya listo.
// ============================================

const { getPool } = require('../config/db');

// Campos que devolvemos al exterior. NUNCA el password_hash.
const CAMPOS_SEGUROS = `
  u.id,
  u.nombre,
  u.email,
  u.rol_id,
  r.nombre AS rol_nombre,
  u.activo,
  u.created_at,
  u.updated_at
`;

/**
 * Lista todos los usuarios activos (con nombre del rol).
 * Si `incluirInactivos`, devuelve todos.
 */
async function listar({ incluirInactivos = false } = {}) {
  const pool = await getPool();
  const where = incluirInactivos ? '' : 'WHERE u.activo = 1';
  const sql = `
    SELECT ${CAMPOS_SEGUROS}
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    ${where}
    ORDER BY u.id ASC
  `;
  const [rows] = await pool.query(sql);
  return rows;
}

/**
 * Obtiene un usuario por ID (con nombre del rol).
 * Devuelve null si no existe.
 */
async function obtenerPorId(id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT ${CAMPOS_SEGUROS}
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.id = ?
    `,
    [id]
  );
  return rows[0] || null;
}

/**
 * Obtiene un usuario por email INCLUYENDO el password_hash.
 * Solo se usará para login (Fase 6). Nunca se devuelve al cliente.
 */
async function obtenerPorEmailConHash(email) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.password_hash,
      u.rol_id,
      r.nombre AS rol_nombre,
      u.activo
    FROM usuarios u
    INNER JOIN roles r ON r.id = u.rol_id
    WHERE u.email = ?
    `,
    [email]
  );
  return rows[0] || null;
}

/**
 * Crea un usuario.
 * @param {object} datos - { nombre, email, password_hash, rol_id }
 * Lanza error si el email ya existe (ER_DUP_ENTRY) o si el rol no existe (ER_NO_REFERENCED_ROW_2).
 */
async function crear({ nombre, email, password_hash, rol_id }) {
  const pool = await getPool();
  const [result] = await pool.query(
    `
    INSERT INTO usuarios (nombre, email, password_hash, rol_id)
    VALUES (?, ?, ?, ?)
    `,
    [nombre, email, password_hash, rol_id]
  );
  return obtenerPorId(result.insertId);
}

/**
 * Actualiza los datos del usuario (sin tocar contraseña).
 * @param {object} datos - { nombre, email, rol_id }
 */
async function actualizar(id, { nombre, email, rol_id }) {
  const pool = await getPool();
  const [result] = await pool.query(
    `
    UPDATE usuarios
    SET nombre = ?, email = ?, rol_id = ?
    WHERE id = ?
    `,
    [nombre, email, rol_id, id]
  );
  if (result.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/**
 * Cambia la contraseña (recibe el hash ya generado).
 */
async function cambiarPassword(id, password_hash) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE usuarios SET password_hash = ? WHERE id = ?',
    [password_hash, id]
  );
  return result.affectedRows > 0;
}

/**
 * Desactiva un usuario (soft delete). No se puede borrar si tiene ventas.
 */
async function desactivar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE usuarios SET activo = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Reactiva un usuario.
 */
async function activar(id) {
  const pool = await getPool();
  const [result] = await pool.query(
    'UPDATE usuarios SET activo = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorEmailConHash,
  crear,
  actualizar,
  cambiarPassword,
  desactivar,
  activar
};