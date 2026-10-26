const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verificarJWT, requireRole } = require('../middlewares/auth.middleware');

// TODAS las rutas de usuarios son exclusivas del administrador
router.use(verificarJWT, requireRole('administrador'));

router.get('/', usuarioController.listar);
router.post('/', usuarioController.crear);
router.put('/:id', usuarioController.actualizar);
router.delete('/:id', usuarioController.desactivar);
router.patch('/:id/activar', usuarioController.activar);

module.exports = router;