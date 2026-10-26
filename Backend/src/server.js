// ============================================
// src/server.js
// Servidor principal del backend
// ============================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { getPool } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const testRoutes = require('./routes/admin.routes');
const categoriaRoutes = require('./routes/categoria.routes');
const productoRoutes = require('./routes/producto.routes');
const inventarioRoutes = require('./routes/inventario.routes'); 
const ventaRoutes = require('./routes/venta.routes'); 
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------------------------------
// Middlewares globales
// --------------------------------------------
app.use(helmet());                              // Cabeceras de seguridad
app.use(morgan('dev'));                         // Registrar peticiones en consola
app.use(express.json());                        // Parsear JSON del body
app.use(express.urlencoded({ extended: true })); // Parsear formularios

// --------------------------------------------
// Configuración de CORS (Seguridad)
// --------------------------------------------
const allowedOrigins = [
  'http://localhost',       // <-- Agrega esta
  'http://127.0.0.1',       // <-- Agrega esta
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman o apps móviles)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true
}));

// --------------------------------------------
// Ruta de prueba (verifica que el servidor vive)
// --------------------------------------------
app.get('/api/ping', (req, res) => {
  res.json({
    ok: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// --------------------------------------------
// Ruta de prueba de conexión a MySQL
// --------------------------------------------
app.get('/api/db-test', async (req, res, next) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(`
      SELECT
        VERSION()  AS version,
        DATABASE() AS base_actual,
        NOW()      AS fecha_servidor
    `);

    res.json({
      ok: true,
      message: 'Conexión a MySQL exitosa',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------
// Rutas de autenticación
// --------------------------------------------
app.use('/api/auth', authRoutes);

// --------------------------------------------
// Rutas de prueba de roles y permisos
// --------------------------------------------
app.use('/api', testRoutes);

// --------------------------------------------
// Rutas de negocio
// --------------------------------------------
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/usuarios', usuarioRoutes);

// --------------------------------------------
// Ruta raíz
// --------------------------------------------
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'API de la tienda. Prueba en /api/ping'
  });
});

// --------------------------------------------
// Manejo de rutas no encontradas (404)
// --------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada'
  });
});

// --------------------------------------------
// Manejo de errores (500)
// --------------------------------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  // En producción no mostramos detalles técnicos de la BD
  const mensaje = process.env.NODE_ENV === 'production' 
    ? 'Error interno del servidor' 
    : err.message;

  res.status(500).json({
    ok: false,
    message: mensaje
  });
});

// --------------------------------------------
// Arrancar el servidor
// --------------------------------------------
// --------------------------------------------
// Arrancar el servidor (Solo si no estamos en pruebas)
app.listen(PORT, () => {
  console.log('');
  console.log('============================================');
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔎 Prueba el endpoint:  http://localhost:${PORT}/api/ping`);
  console.log('============================================');
  console.log('');
});