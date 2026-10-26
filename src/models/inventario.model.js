// ============================================
// src/models/inventario.model.js
// Movimientos de inventario (ENTRADA/SALIDA/AJUSTE)
// ============================================
// La función registrarMovimiento() acepta una conexión externa (conn_externo)
// para poder participar en transacciones mayores (Fase 10 - ventas).
// Si NO se le pasa conexión, crea su propia transacción.
// ============================================

const { getPool } = require('../config/db');

const CAMPOS_SELECT = `
  i.id,
  i.producto_id,
  p.codigo AS producto_codigo,
  p.nombre AS producto_nombre,
  i.tipo,
  i.cantidad,
  i.stock_anterior,
  i.stock_nuevo,
  i.motivo,
  i.usuario_id,
  u.nombre AS usuario_nombre,
  i.created_at
`;

/**
 * Registra un movimiento de inventario.
 * @param {object} datos - { producto_id, tipo, cantidad, motivo, usuario_id }
 *   - tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
 *   - ENTRADA: stock_nuevo = stock_anterior + cantidad
 *   - SALIDA:  stock_nuevo = stock_anterior - cantidad  (falla si queda negativo)
 *   - AJUSTE:  stock_nuevo = cantidad (fija el stock al valor dado)
 * @param {object|null} conn_externo - conexión ya abierta (opcional)
 * @returns {object} movimiento creado
 */
async function registrarMovimiento(datos, conn_externo = null) {
  const { producto_id, tipo, cantidad, motivo = null, usuario_id } = datos;

  // Validaciones básicas antes de tocar la BD
  if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(tipo)) {
    throw new Error(`Tipo de movimiento inválido: ${tipo}`);
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un entero mayor que 0');
  }

  // ¿Creamos nuestra propia transacción o nos unimos a una existente?
  let conn = conn_externo;
  let propiaTransaccion = false;

  if (!conn) {
    const pool = await getPool();
    conn = await pool.getConnection();
    await conn.beginTransaction();
    propiaTransaccion = true;
  }

  try {
    // 1. Leer producto bloqueando la fila (FOR UPDATE) para evitar condiciones de carrera
    const [prodRows] = await conn.query(
      'SELECT id, stock FROM productos WHERE id = ? FOR UPDATE',
      [producto_id]
    );
    if (prodRows.length === 0) {
      throw new Error(`Producto con id ${producto_id} no existe`);
    }

    const stock_anterior = prodRows[0].stock;
    let stock_nuevo;

    if (tipo === 'ENTRADA') {
      stock_nuevo = stock_anterior + cantidad;
    } else if (tipo === 'SALIDA') {
      stock_nuevo = stock_anterior - cantidad;
      if (stock_nuevo < 0) {
        throw new Error(
          `Stock insuficiente. Disponible: ${stock_anterior}, solicitado: ${cantidad}`
        );
      }
    } else {
      // AJUSTE
      stock_nuevo = cantidad;
    }

    // 2. Insertar el movimiento
    const [insertResult] = await conn.query(
      `
      INSERT INTO inventario
        (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id]
    );

    // 3. Actualizar el stock del producto
    await conn.query(
      'UPDATE productos SET stock = ? WHERE id = ?',
      [stock_nuevo, producto_id]
    );

    if (propiaTransaccion) {
      await conn.commit();
    }

    return {
      id: insertResult.insertId,
      producto_id,
      tipo,
      cantidad,
      stock_anterior,
      stock_nuevo,
      motivo,
      usuario_id
    };
  } catch (error) {
    if (propiaTransaccion) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (propiaTransaccion) {
      conn.release();
    }
  }
}

/**
 * Lista movimientos con filtros opcionales.
 * @param {object} opciones - { producto_id, tipo, desde, hasta }
 */
async function listar({ producto_id = null, tipo = null, desde = null, hasta = null } = {}) {
  const pool = await getPool();
  const where = [];
  const params = [];

  if (producto_id != null) {
    where.push('i.producto_id = ?');
    params.push(producto_id);
  }
  if (tipo != null) {
    where.push('i.tipo = ?');
    params.push(tipo);
  }
  if (desde) {
    where.push('i.created_at >= ?');
    params.push(desde);
  }
  if (hasta) {
    where.push('i.created_at <= ?');
    params.push(hasta);
  }

  const sql = `
    SELECT ${CAMPOS_SELECT}
    FROM inventario i
    INNER JOIN productos p ON p.id = i.producto_id
    INNER JOIN usuarios u ON u.id = i.usuario_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY i.id DESC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Lista los movimientos de un producto específico.
 */
async function listarPorProducto(producto_id) {
  return listar({ producto_id });
}

module.exports = {
  registrarMovimiento,
  listar,
  listarPorProducto
};