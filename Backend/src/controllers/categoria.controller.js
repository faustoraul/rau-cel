// ============================================
// src/controllers/categoria.controller.js
// CRUD de categorías
// ============================================

const categoriaModel = require('../models/categoria.model');

/**
 * GET /api/categorias
 * Query opcional: ?incluirInactivas=true
 * Acceso: cualquier autenticado
 */
async function listar(req, res, next) {
  try {
    const incluirInactivas = req.query.incluirInactivas === 'true';
    const data = await categoriaModel.listar({ incluirInactivas });
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/categorias/:id
 * Acceso: cualquier autenticado
 */
async function obtenerPorId(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const data = await categoriaModel.obtenerPorId(id);
    if (!data) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/categorias
 * Body: { nombre, descripcion? }
 * Acceso: solo administrador
 */
async function crear(req, res, next) {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre es requerido y debe tener al menos 2 caracteres'
      });
    }
    if (nombre.trim().length > 100) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre no puede exceder 100 caracteres'
      });
    }
    if (descripcion && descripcion.length > 255) {
      return res.status(400).json({
        ok: false,
        message: 'La descripción no puede exceder 255 caracteres'
      });
    }

    const data = await categoriaModel.crear({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null
    });

    res.status(201).json({
      ok: true,
      message: 'Categoría creada',
      data
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }
    next(error);
  }
}

/**
 * PUT /api/categorias/:id
 * Body: { nombre, descripcion? }
 * Acceso: solo administrador
 */
async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const { nombre, descripcion } = req.body;
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre es requerido y debe tener al menos 2 caracteres'
      });
    }

    const data = await categoriaModel.actualizar(id, {
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null
    });

    if (!data) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }

    res.json({ ok: true, message: 'Categoría actualizada', data });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe otra categoría con ese nombre'
      });
    }
    next(error);
  }
}

/**
 * DELETE /api/categorias/:id
 * Soft delete (desactiva). Acceso: solo administrador
 */
async function desactivar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const eliminado = await categoriaModel.desactivar(id);
    if (!eliminado) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }
    res.json({ ok: true, message: 'Categoría desactivada' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/categorias/:id/activar
 * Reactiva una categoría. Acceso: solo administrador
 */
async function activar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const ok = await categoriaModel.activar(id);
    if (!ok) {
      return res.status(404).json({ ok: false, message: 'Categoría no encontrada' });
    }
    res.json({ ok: true, message: 'Categoría activada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, desactivar, activar };