// ============================================
// src/controllers/usuario.controller.js
// CRUD de usuarios (solo para administradores)
// ============================================

const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuario.model');
const rolModel = require('../models/rol.model');

const BCRYPT_ROUNDS = 10;

// GET /api/usuarios
async function listar(req, res, next) {
  try {
    const usuarios = await usuarioModel.listar({ incluirInactivos: true });
    res.json({ ok: true, data: usuarios });
  } catch (error) {
    next(error);
  }
}

// POST /api/usuarios
async function crear(req, res, next) {
  try {
    const { nombre, email, password, rol_id } = req.body;

    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({ ok: false, message: 'Todos los campos son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existente = await usuarioModel.obtenerPorEmailConHash(email);
    if (existente) {
      return res.status(409).json({ ok: false, message: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const nuevo = await usuarioModel.crear({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash: hash,
      rol_id: Number(rol_id)
    });

    res.status(201).json({ ok: true, message: 'Usuario creado', data: nuevo });
  } catch (error) {
    next(error);
  }
}

// PUT /api/usuarios/:id
async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { nombre, email, rol_id } = req.body;

    if (!nombre || !email || !rol_id) {
      return res.status(400).json({ ok: false, message: 'Nombre, email y rol son obligatorios' });
    }

    // Verificar que no esté intentando usar el email de OTRO usuario
    const existente = await usuarioModel.obtenerPorEmailConHash(email);
    if (existente && existente.id !== id) {
      return res.status(409).json({ ok: false, message: 'El email ya está en uso por otro usuario' });
    }

    const actualizado = await usuarioModel.actualizar(id, {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol_id: Number(rol_id)
    });

    if (!actualizado) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    
    res.json({ ok: true, message: 'Usuario actualizado', data: actualizado });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/usuarios/:id (Desactivar)
async function desactivar(req, res, next) {
  try {
    const id = Number(req.params.id);
    // Evitar que el admin se desactive a sí mismo por error
    if (id === req.usuario.id) {
      return res.status(400).json({ ok: false, message: 'No puedes desactivar tu propio usuario' });
    }
    const ok = await usuarioModel.desactivar(id);
    if (!ok) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    res.json({ ok: true, message: 'Usuario desactivado' });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/usuarios/:id/activar
async function activar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const ok = await usuarioModel.activar(id);
    if (!ok) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    res.json({ ok: true, message: 'Usuario activado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, crear, actualizar, desactivar, activar };