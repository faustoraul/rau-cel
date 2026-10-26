// ============================================
// src/models/ventaDetalle.model.js
// Consultas sobre los detalles (líneas) de una venta
// ============================================
// Las inserciones de detalle se hacen DENTRO de venta.crearVenta()
// para mantenerlas en la misma transacción.
// Este modelo solo expone lecturas.
// ============================================

const { getPool } = require('../config/db');

const CAMPOS_SELECT = `
  vd.id,
  vd.venta_id,
  vd.producto_id,
  p.codigo AS producto_codigo,
  p.nombre AS producto_nombre,
  vd.cantidad,
  vd.precio_unitario,
  vd.subtotal
`;

/**
 * Lista los detalles de una venta.
 */
async function listarPorVenta(venta_id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `
    SELECT ${CAMPOS_SELECT}
    FROM venta_detalle vd
    INNER JOIN productos p ON p.id = vd.producto_id
    WHERE vd.venta_id = ?
    ORDER BY vd.id ASC
    `,
    [venta_id]
  );
  return rows;
}

module.exports = {
  listarPorVenta
};