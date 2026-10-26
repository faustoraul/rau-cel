// ============================================
// src/routes/auth.routes.js
// Rutas de autenticación
// ============================================

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { verificarJWT, optionalJWT } = require('../middlewares/auth.middleware');

// Registro: público, pero con optionalJWT
// (si viene un token de admin, puede crear admins; si no, solo vendedores)
router.post('/register', optionalJWT, authController.register);

// Login: público
router.post('/login', authController.login);

// Perfil: protegido
router.get('/me', verificarJWT, authController.me);

module.exports = router;