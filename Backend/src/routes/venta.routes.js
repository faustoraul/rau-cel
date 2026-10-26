// ============================================
// src/routes/venta.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/venta.controller');
const { verificarJWT } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación, sin importar el rol.
// Tanto vendedor como administrador pueden vender.
router.get('/', verificarJWT, ventaController.listar);
router.get('/:id', verificarJWT, ventaController.obtenerPorId);
router.post('/', verificarJWT, ventaController.crear);

module.exports = router;