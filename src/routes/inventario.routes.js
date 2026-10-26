// ============================================
// src/routes/inventario.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventario.controller');
const { verificarJWT, requireRole } = require('../middlewares/auth.middleware');

// Lectura: cualquier autenticado
router.get('/', verificarJWT, inventarioController.listar);
router.get('/producto/:id', verificarJWT, inventarioController.listarPorProducto);

// Escritura: solo administrador
router.post('/', verificarJWT, requireRole('administrador'), inventarioController.registrar);

module.exports = router;