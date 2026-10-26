// ============================================
// src/controllers/auth.controller.js
// Registro, login y perfil del usuario autenticado
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuario.model');
const rolModel = require('../models/rol.model');

const BCRYPT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Body: { nombre, email, password, rol_id? }
 * Reglas de rol:
 *   - Anónimo o vendedor  → solo puede crear vendedores (rol_id 2)
 *   - Administrador       → puede crear administradores (rol_id 1) o vendedores (rol_id 2)
 */
async function register(req, res, next) {
  try {
    const { nombre, email, password, rol_id } = req.body;

    // --- Validaciones básicas ---
    if (!nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'nombre, email y password son requeridos'
      });
    }
    if (nombre.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ ok: false, message: 'Email inválido' });
    }
    if (password.length < 6) {
      return res.status(400).json({
        ok: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // --- Determinar qué rol se puede crear ---
    let rolFinal;
    if (rol_id != null) {
      const rolSolicitado = Number(rol_id);
      if (![1, 2].includes(rolSolicitado)) {
        return res.status(400).json({ ok: false, message: 'Rol inválido' });
      }
      if (rolSolicitado === 1) {
        if (!req.usuario || req.usuario.rol_nombre !== 'administrador') {
          return res.status(403).json({
            ok: false,
            message: 'Solo un administrador puede crear otros administradores'
          });
        }
        rolFinal = 1;
      } else {
        rolFinal = 2;
      }
    } else {
      rolFinal = 2;
    }

    // --- Email único ---
    const existente = await usuarioModel.obtenerPorEmailConHash(email);
    if (existente) {
      return res.status(409).json({
        ok: false,
        message: 'El email ya está registrado'
      });
    }

    // --- Rol válido en la BD ---
    const rol = await rolModel.obtenerPorId(rolFinal);
    if (!rol) {
      return res.status(400).json({ ok: false, message: 'Rol inválido' });
    }

    // --- Hash de contraseña ---
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // --- Crear usuario ---
    const nuevo = await usuarioModel.crear({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      rol_id: rolFinal
    });

    res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente',
      data: nuevo
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Devuelve { token, usuario } si las credenciales son válidas.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        message: 'email y password son requeridos'
      });
    }

    const usuario = await usuarioModel.obtenerPorEmailConHash(email.trim().toLowerCase());

    if (!usuario) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }
    if (usuario.activo === 0) {
      return res.status(403).json({ ok: false, message: 'Usuario desactivado' });
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol_nombre
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    res.json({
      ok: true,
      message: 'Login exitoso',
      data: { token, usuario: payload }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Requiere JWT. Devuelve los datos frescos del usuario autenticado.
 */
async function me(req, res, next) {
  try {
    const usuario = await usuarioModel.obtenerPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
    }
    res.json({ ok: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me };