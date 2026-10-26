// ============================================
// src/config/db.js
// Pool de conexiones a MySQL
// ============================================

const mysql = require('mysql2/promise');

let pool = null;

/**
 * Devuelve el pool de conexiones (lo crea la primera vez).
 * Si la conexión falla, resetea el pool para que el próximo intento lo reintente.
 */
async function getPool() {
  try {
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
      });

      // Verificación temprana: probar que el pool conecta
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();

      console.log('✅ Conectado a MySQL');
    }
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    pool = null;
    throw error;
  }
}

module.exports = { mysql, getPool };