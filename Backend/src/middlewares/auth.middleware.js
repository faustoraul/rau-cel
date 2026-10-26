// ============================================
// src/middlewares/auth.middleware.js
// Middleware para verificar JWT y roles
// ============================================

const jwt = require('jsonwebtoken');

/**
 * Middleware: verifica el token JWT del header `Authorization: Bearer <token>`.
 * Si es válido, deja el payload en `req.usuario` y llama a next().
 * Si no, responde 401.
 */
function verificarJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      message: 'Token no proporcionado. Usa header: Authorization: Bearer <token>'
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ ok: false, message: 'Token inválido' });
    }
    return res.status(401).json({ ok: false, message: 'Error de autenticación' });
  }
}

/**
 * Middleware: intenta verificar el JWT si viene, pero NO bloquea si no viene
 * o si es inválido. Deja `req.usuario` solo si el token es válido.
 * Útil para rutas "públicas pero con más permisos si estás autenticado"
 * (ej: /register, donde un admin puede crear admins pero un anónimo solo vendedores).
 */
function optionalJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // sin token → seguimos como anónimo
  }
  const token = authHeader.slice(7);
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // token inválido: lo ignoramos (tratado como anónimo)
  }
  next();
}

/**
 * Middleware factory: requiere que el usuario autenticado tenga uno de los
 * roles indicados. Usar SIEMPRE después de verificarJWT.
 * Ejemplo: router.post('/', verificarJWT, requireRole('administrador'), handler)
 */
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, message: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(req.usuario.rol_nombre)) {
      return res.status(403).json({
        ok: false,
        message: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`
      });
    }
    next();
  };
}

module.exports = { verificarJWT, optionalJWT, requireRole };