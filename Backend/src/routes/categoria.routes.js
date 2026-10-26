// ============================================
// src/routes/categoria.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoria.controller');
const { verificarJWT, requireRole } = require('../middlewares/auth.middleware');

// Lectura: cualquier autenticado
router.get('/', verificarJWT, categoriaController.listar);
router.get('/:id', verificarJWT, categoriaController.obtenerPorId);

// Escritura: solo administrador
router.post('/', verificarJWT, requireRole('administrador'), categoriaController.crear);
router.put('/:id', verificarJWT, requireRole('administrador'), categoriaController.actualizar);
router.delete('/:id', verificarJWT, requireRole('administrador'), categoriaController.desactivar);
router.patch('/:id/activar', verificarJWT, requireRole('administrador'), categoriaController.activar);

module.exports = router;