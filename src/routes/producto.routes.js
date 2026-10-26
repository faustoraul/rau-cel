// ============================================
// src/routes/producto.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/producto.controller');
const { verificarJWT, requireRole } = require('../middlewares/auth.middleware');

// Lectura: cualquier autenticado
router.get('/', verificarJWT, productoController.listar);
router.get('/:id', verificarJWT, productoController.obtenerPorId);

// Escritura: solo administrador
router.post('/', verificarJWT, requireRole('administrador'), productoController.crear);
router.put('/:id', verificarJWT, requireRole('administrador'), productoController.actualizar);
router.delete('/:id', verificarJWT, requireRole('administrador'), productoController.desactivar);
router.patch('/:id/activar', verificarJWT, requireRole('administrador'), productoController.activar);

module.exports = router;