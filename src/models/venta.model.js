// ============================================
// src/models/venta.model.js
// Registro de ventas con transacción completa
// ============================================
// crearVenta() es la operación más delicada del sistema:
//   1. Valida stock de todos los productos
//   2. Calcula subtotal, impuesto y total
//   3. Inserta la venta
//   4. Inserta cada detalle
//   5. Descuenta stock + registra movimiento de inventario
//   6. COMMIT o ROLLBACK
// ============================================

const { getPool } = require('../config/db');
const inventarioModel = require('./inventario.model');

const IMPUESTO_POR_DEFECTO = 0.18; // 18% (ITBIS RD). Cambiar aquí si aplica.

/**
 * Genera un número de venta único: V-YYYYMMDDHHMMSS-XXXX (XXXX aleatorio).
 */
function generarNumeroVenta() {
  const d = new Date();
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const fecha =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
  const rand = pad(Math.floor(Math.random() * 10000), 4);
  return `V-${fecha}-${rand}`;
}

/**
 * Redondea a 2 decimales sin errores de coma flotante.
 */
function r2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Crea una venta completa con todos sus detalles y movimientos de inventario.
 * @param {object} datos
 *   @param {number} usuario_id
 *   @param {Array<{producto_id:number, cantidad:number}>} items
 *   @param {number} [impuesto_pct=0.18]
 * @returns {object} venta creada con sus detalles
 */
async function crearVenta({ usuario_id, items, impuesto_pct = IMPUESTO_POR_DEFECTO }) {
  // Validaciones de entrada (antes de abrir conexión)
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La venta debe tener al menos un producto');
  }
  for (const it of items) {
    if (!Number.isInteger(it.cantidad) || it.cantidad <= 0) {
      throw new Error(`Cantidad inválida para producto ${it.producto_id}`);
    }
  }

  const pool = await getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Procesar cada línea: leer producto (FOR UPDATE), validar stock y calcular subtotal
    const lineas = [];
    let subtotalGeneral = 0;

    for (const item of items) {
      const [prodRows] = await conn.query(
        'SELECT id, codigo, nombre, precio, stock, activo FROM productos WHERE id = ? FOR UPDATE',
        [item.producto_id]
      );
      if (prodRows.length === 0) {
        throw new Error(`Producto ${item.producto_id} no existe`);
      }
      const prod = prodRows[0];
      if (prod.activo === 0) {
        throw new Error(`Producto "${prod.nombre}" está desactivado`);
      }
      if (prod.stock < item.cantidad) {
        throw new Error(
          `Stock insuficiente de "${prod.nombre}". Disponible: ${prod.stock}, solicitado: ${item.cantidad}`
        );
      }

      const precioUnit = parseFloat(prod.precio);
      const subtotalLinea = r2(precioUnit * item.cantidad);
      subtotalGeneral = r2(subtotalGeneral + subtotalLinea);

      lineas.push({
        producto_id: prod.id,
        cantidad: item.cantidad,
        precio_unitario: precioUnit,
        subtotal: subtotalLinea,
        _nombre: prod.nombre
      });
    }

    // 2. Cálculos generales
    const impuesto = r2(subtotalGeneral * impuesto_pct);
    const total = r2(subtotalGeneral + impuesto);
    const numero_venta = generarNumeroVenta();

    // 3. Insertar la venta
    const [ventaResult] = await conn.query(
      `
      INSERT INTO ventas
        (numero_venta, usuario_id, subtotal, impuesto, total, estado)
      VALUES (?, ?, ?, ?, ?, 'COMPLETADA')
      `,
      [numero_venta, usuario_id, subtotalGeneral, impuesto, total]
    );
    const venta_id = ventaResult.insertId;

    // 4. Insertar detalles + registrar movimiento de inventario
    //    (registrarMovimiento ya descuenta stock; NO duplicamos el UPDATE)
    for (const linea of lineas) {
      // 4a. Insertar el detalle
      await conn.query(
        `
        INSERT INTO venta_detalle
          (venta_id, producto_id, cantidad, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
        `,
        [venta_id, linea.producto_id, linea.cantidad, linea.precio_unitario, linea.subtotal]
      );

      // 4b. Registrar el movimiento de inventario (SALIDA).
      //     registrarMovimiento() se encarga de:
      //       - leer stock actual con FOR UPDATE
      //       - calcular stock_nuevo
      //       - insertar fila en `inventario`
      //       - actualizar productos.stock
      //     Le pasamos `conn` para que participe en la MISMA transacción.
      await inventarioModel.registrarMovimiento(
        {
          producto_id: linea.producto_id,
          tipo: 'SALIDA',
          cantidad: linea.cantidad,
          motivo: `Venta ${numero_venta}`,
          usuario_id
        },
        conn
      );
    }

    await conn.commit();

    // Devolvemos la venta completa
    return {
      id: venta_id,
      numero_venta,
      usuario_id,
      subtotal: subtotalGeneral,
      impuesto,
      total,
      estado: 'COMPLETADA',
      items: lineas.map((l) => ({
        producto_id: l.producto_id,
        nombre: l._nombre,
        cantidad: l.cantidad,
        precio_unitario: l.precio_unitario,
        subtotal: l.subtotal
      }))
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Lista ventas con filtros opcionales.
 * @param {object} opciones - { desde, hasta, usuario_id, estado }
 */
async function listar({ desde = null, hasta = null, usuario_id = null, estado = null } = {}) {
  const pool = await getPool();
  const where = [];
  const params = [];

  if (desde) { where.push('v.created_at >= ?'); params.push(desde); }
  if (hasta) { where.push('v.created_at <= ?'); params.push(hasta); }
  if (usuario_id != null) { where.push('v.usuario_id = ?'); params.push(usuario_id); }
  if (estado) { where.push('v.estado = ?'); params.push(estado); }

  const sql = `
    SELECT
      v.id, v.numero_venta, v.usuario_id,
      u.nombre AS usuario_nombre,
      v.subtotal, v.impuesto, v.total, v.estado, v.created_at
    FROM ventas v
    INNER JOIN usuarios u ON u.id = v.usuario_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY v.id DESC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Obtiene una venta con todos sus detalles. Devuelve null si no existe.
 */
async function obtenerPorId(id) {
  const pool = await getPool();

  const [ventaRows] = await pool.query(
    `
    SELECT
      v.id, v.numero_venta, v.usuario_id,
      u.nombre AS usuario_nombre,
      v.subtotal, v.impuesto, v.total, v.estado, v.created_at
    FROM ventas v
    INNER JOIN usuarios u ON u.id = v.usuario_id
    WHERE v.id = ?
    `,
    [id]
  );
  if (ventaRows.length === 0) return null;

  const venta = ventaRows[0];

  const [detalles] = await pool.query(
    `
    SELECT
      vd.id, vd.producto_id,
      p.codigo AS producto_codigo,
      p.nombre AS producto_nombre,
      vd.cantidad, vd.precio_unitario, vd.subtotal
    FROM venta_detalle vd
    INNER JOIN productos p ON p.id = vd.producto_id
    WHERE vd.venta_id = ?
    ORDER BY vd.id ASC
    `,
    [id]
  );

  return { ...venta, detalles };
}

module.exports = {
  crearVenta,
  listar,
  obtenerPorId
};