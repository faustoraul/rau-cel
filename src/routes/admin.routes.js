// ============================================
// src/routes/admin.routes.js
// Rutas de PRUEBA para validar requireRole
// (En Fase 8 se reemplazan por rutas de negocio reales)
// ============================================

const express = require('express');
const router = express.Router();

const { verificarJWT, requireRole } = require('../middlewares/auth.middleware');

// --------------------------------------------
// Cualquier autenticado (admin o vendedor)
// --------------------------------------------
router.get('/protegido', verificarJWT, (req, res) => {
  res.json({
    ok: true,
    message: 'Acceso concedido a ruta protegida',
    usuario: req.usuario
  });
});

// --------------------------------------------
// Solo administrador
// --------------------------------------------
router.get('/admin/only', verificarJWT, requireRole('administrador'), (req, res) => {
  res.json({
    ok: true,
    message: 'Acceso concedido a ruta de administrador',
    usuario: req.usuario
  });
});

// --------------------------------------------
// Solo vendedor
// --------------------------------------------
router.get('/vendedor/only', verificarJWT, requireRole('vendedor'), (req, res) => {
  res.json({
    ok: true,
    message: 'Acceso concedido a ruta de vendedor',
    usuario: req.usuario
  });
});

module.exports = router;