// ============================================
// src/controllers/inventario.controller.js
// Endpoints de inventario
// ============================================

const inventarioModel = require('../models/inventario.model');
const productoModel = require('../models/producto.model');

/**
 * GET /api/inventario
 * Query: ?producto_id=&tipo=&desde=&hasta=
 * Acceso: cualquier autenticado
 */
async function listar(req, res, next) {
  try {
    const opciones = {
      producto_id: req.query.producto_id ? Number(req.query.producto_id) : null,
      tipo: req.query.tipo || null,
      desde: req.query.desde || null,
      hasta: req.query.hasta || null
    };

    if (opciones.producto_id != null && (!Number.isInteger(opciones.producto_id) || opciones.producto_id <= 0)) {
      return res.status(400).json({ ok: false, message: 'producto_id inválido' });
    }
    if (opciones.tipo && !['ENTRADA', 'SALIDA', 'AJUSTE'].includes(opciones.tipo)) {
      return res.status(400).json({ ok: false, message: 'tipo inválido. Debe ser ENTRADA, SALIDA o AJUSTE' });
    }

    const data = await inventarioModel.listar(opciones);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/inventario/producto/:id
 * Historial de movimientos de un producto
 * Acceso: cualquier autenticado
 */
async function listarPorProducto(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    // Verificar que el producto exista (aunque esté desactivado, se puede consultar historial)
    const producto = await productoModel.obtenerPorId(id);
    if (!producto) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }

    const data = await inventarioModel.listarPorProducto(id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/inventario
 * Body: { producto_id, tipo, cantidad, motivo? }
 * Acceso: solo administrador
 */
async function registrar(req, res, next) {
  try {
    const { producto_id, tipo, cantidad, motivo } = req.body;

    // --- Validaciones básicas ---
    const prodId = Number(producto_id);
    if (!Number.isInteger(prodId) || prodId <= 0) {
      return res.status(400).json({ ok: false, message: 'producto_id inválido' });
    }

    if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(tipo)) {
      return res.status(400).json({
        ok: false,
        message: 'tipo inválido. Debe ser ENTRADA, SALIDA o AJUSTE'
      });
    }

    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'cantidad debe ser un entero mayor que 0'
      });
    }

    if (motivo && motivo.length > 255) {
      return res.status(400).json({
        ok: false,
        message: 'motivo no puede exceder 255 caracteres'
      });
    }

    // --- Validar que el producto exista y esté activo ---
    const producto = await productoModel.obtenerPorId(prodId);
    if (!producto) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    if (producto.activo === 0) {
      return res.status(400).json({
        ok: false,
        message: 'No se puede registrar movimiento a un producto desactivado'
      });
    }

    // --- Registrar movimiento (transacción en el modelo) ---
    let movimiento;
    try {
      movimiento = await inventarioModel.registrarMovimiento({
        producto_id: prodId,
        tipo,
        cantidad: cant,
        motivo: motivo ? motivo.trim() : null,
        usuario_id: req.usuario.id
      });
    } catch (error) {
      // Errores de negocio conocidos: stock insuficiente
      if (error.message.startsWith('Stock insuficiente')) {
        return res.status(400).json({ ok: false, message: error.message });
      }
      if (error.message.startsWith('Producto con id')) {
        return res.status(404).json({ ok: false, message: error.message });
      }
      throw error; // otros errores → middleware global
    }

    res.status(201).json({
      ok: true,
      message: 'Movimiento registrado',
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, listarPorProducto, registrar };