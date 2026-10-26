// ============================================
// src/controllers/venta.controller.js
// Registrar y consultar ventas
// ============================================

const ventaModel = require('../models/venta.model');
const usuarioModel = require('../models/usuario.model');

/**
 * GET /api/ventas
 * Query: ?desde=&hasta=&usuario_id=&estado=
 * Acceso: cualquier autenticado
 */
async function listar(req, res, next) {
  try {
    const opciones = {
      desde: req.query.desde || null,
      hasta: req.query.hasta || null,
      usuario_id: req.query.usuario_id ? Number(req.query.usuario_id) : null,
      estado: req.query.estado || null
    };

    if (opciones.usuario_id != null && (!Number.isInteger(opciones.usuario_id) || opciones.usuario_id <= 0)) {
      return res.status(400).json({ ok: false, message: 'usuario_id inválido' });
    }
    if (opciones.estado && !['COMPLETADA', 'ANULADA'].includes(opciones.estado)) {
      return res.status(400).json({ ok: false, message: 'estado inválido. Debe ser COMPLETADA o ANULADA' });
    }

    const data = await ventaModel.listar(opciones);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/ventas/:id
 * Devuelve la venta con sus detalles (comprobante).
 * Acceso: cualquier autenticado
 */
async function obtenerPorId(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const data = await ventaModel.obtenerPorId(id);
    if (!data) {
      return res.status(404).json({ ok: false, message: 'Venta no encontrada' });
    }
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/ventas
 * Body: { items: [{producto_id, cantidad}], impuesto_pct? }
 * El usuario_id se toma del JWT (req.usuario.id), NO del body.
 * Acceso: cualquier autenticado (vendedor o administrador)
 */
async function crear(req, res, next) {
  try {
    const { items, impuesto_pct } = req.body;

    // --- Validar items ---
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Debes enviar al menos un item en `items`'
      });
    }

    // Normalizar y validar cada item
    const itemsNormalizados = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const prodId = Number(it.producto_id);
      const cant = Number(it.cantidad);

      if (!Number.isInteger(prodId) || prodId <= 0) {
        return res.status(400).json({
          ok: false,
          message: `items[${i}].producto_id inválido`
        });
      }
      if (!Number.isInteger(cant) || cant <= 0) {
        return res.status(400).json({
          ok: false,
          message: `items[${i}].cantidad debe ser un entero mayor que 0`
        });
      }

      itemsNormalizados.push({ producto_id: prodId, cantidad: cant });
    }

    // --- Validar impuesto_pct (opcional) ---
    let impuestoFinal = 0.18;
    if (impuesto_pct != null) {
      const num = Number(impuesto_pct);
      if (!Number.isFinite(num) || num < 0 || num > 1) {
        return res.status(400).json({
          ok: false,
          message: 'impuesto_pct debe ser un número entre 0 y 1 (ej. 0.18 para 18%)'
        });
      }
      impuestoFinal = num;
    }

    // --- Verificar que el usuario del token siga activo ---
    // (por si fue desactivado después de emitir el token)
    const usuario = await usuarioModel.obtenerPorId(req.usuario.id);
    if (!usuario || usuario.activo === 0) {
      return res.status(403).json({
        ok: false,
        message: 'Usuario no autorizado para registrar ventas'
      });
    }

    // --- Crear la venta (transacción en el modelo) ---
    let venta;
    try {
      venta = await ventaModel.crearVenta({
        usuario_id: req.usuario.id,
        items: itemsNormalizados,
        impuesto_pct: impuestoFinal
      });
    } catch (error) {
      // Errores de negocio del modelo → 400
      const msg = error.message || '';
      if (
        msg.startsWith('Stock insuficiente') ||
        msg.startsWith('Producto') || // "Producto X no existe" o "Producto Y está desactivado"
        msg.startsWith('La venta debe tener') ||
        msg.startsWith('Cantidad inválida')
      ) {
        const status = msg.endsWith('no existe') ? 404 : 400;
        return res.status(status).json({ ok: false, message: msg });
      }
      throw error; // otros → middleware global (500)
    }

    res.status(201).json({
      ok: true,
      message: 'Venta registrada correctamente',
      data: venta
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear };