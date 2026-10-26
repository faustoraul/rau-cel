// ============================================
// src/controllers/producto.controller.js
// CRUD de productos
// ============================================

const productoModel = require('../models/producto.model');
const categoriaModel = require('../models/categoria.model');

/**
 * GET /api/productos
 * Query: ?categoria_id=&busqueda=&incluirInactivos=true
 * Acceso: cualquier autenticado
 */
async function listar(req, res, next) {
  try {
    const opciones = {
      incluirInactivos: req.query.incluirInactivos === 'true',
      categoria_id: req.query.categoria_id ? Number(req.query.categoria_id) : null,
      busqueda: req.query.busqueda || null
    };
    if (opciones.categoria_id != null && (!Number.isInteger(opciones.categoria_id) || opciones.categoria_id <= 0)) {
      return res.status(400).json({ ok: false, message: 'categoria_id inválido' });
    }
    const data = await productoModel.listar(opciones);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/productos/:id
 * Acceso: cualquier autenticado
 */
async function obtenerPorId(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const data = await productoModel.obtenerPorId(id);
    if (!data) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * Validaciones comunes para crear/actualizar.
 * Devuelve { valido: true, datos } o { valido: false, message }.
 */
function validarProducto(body, { esCreacion }) {
  const { codigo, nombre, descripcion, precio, stock, stock_minimo, categoria_id } = body;

  if (esCreacion && (!codigo || typeof codigo !== 'string' || codigo.trim().length < 1)) {
    return { valido: false, message: 'El código es requerido' };
  }
  if (codigo && codigo.trim().length > 50) {
    return { valido: false, message: 'El código no puede exceder 50 caracteres' };
  }
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    return { valido: false, message: 'El nombre es requerido y debe tener al menos 2 caracteres' };
  }
  if (nombre.trim().length > 150) {
    return { valido: false, message: 'El nombre no puede exceder 150 caracteres' };
  }
  if (descripcion && descripcion.length > 500) {
    return { valido: false, message: 'La descripción no puede exceder 500 caracteres' };
  }

  const precioNum = Number(precio);
  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return { valido: false, message: 'El precio debe ser un número mayor o igual a 0' };
  }

  let stockNum = 0;
  if (stock != null) {
    stockNum = Number(stock);
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      return { valido: false, message: 'El stock debe ser un entero mayor o igual a 0' };
    }
  }

  let stockMinNum = 0;
  if (stock_minimo != null) {
    stockMinNum = Number(stock_minimo);
    if (!Number.isInteger(stockMinNum) || stockMinNum < 0) {
      return { valido: false, message: 'stock_minimo debe ser un entero mayor o igual a 0' };
    }
  }

  const catId = Number(categoria_id);
  if (!Number.isInteger(catId) || catId <= 0) {
    return { valido: false, message: 'categoria_id inválido' };
  }

  return {
    valido: true,
    datos: {
      codigo: codigo ? codigo.trim() : undefined,
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null,
      precio: precioNum,
      stock: stockNum,
      stock_minimo: stockMinNum,
      categoria_id: catId
    }
  };
}

/**
 * POST /api/productos
 * Acceso: solo administrador
 */
async function crear(req, res, next) {
  try {
    const v = validarProducto(req.body, { esCreacion: true });
    if (!v.valido) {
      return res.status(400).json({ ok: false, message: v.message });
    }

    // Categoría debe existir y estar activa
    const cat = await categoriaModel.obtenerPorId(v.datos.categoria_id);
    if (!cat) {
      return res.status(400).json({ ok: false, message: 'La categoría no existe' });
    }
    if (cat.activo === 0) {
      return res.status(400).json({ ok: false, message: 'La categoría está desactivada' });
    }

    const data = await productoModel.crear(v.datos);
    res.status(201).json({ ok: true, message: 'Producto creado', data });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, message: 'Ya existe un producto con ese código' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ ok: false, message: 'La categoría no existe' });
    }
    next(error);
  }
}

/**
 * PUT /api/productos/:id
 * Acceso: solo administrador
 */
async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }

    const v = validarProducto(req.body, { esCreacion: false });
    if (!v.valido) {
      return res.status(400).json({ ok: false, message: v.message });
    }

    const cat = await categoriaModel.obtenerPorId(v.datos.categoria_id);
    if (!cat) {
      return res.status(400).json({ ok: false, message: 'La categoría no existe' });
    }

    const data = await productoModel.actualizar(id, v.datos);
    if (!data) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, message: 'Producto actualizado', data });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ ok: false, message: 'Ya existe otro producto con ese código' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ ok: false, message: 'La categoría no existe' });
    }
    next(error);
  }
}

/**
 * DELETE /api/productos/:id
 * Soft delete. Acceso: solo administrador
 */
async function desactivar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const ok = await productoModel.desactivar(id);
    if (!ok) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, message: 'Producto desactivado' });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/productos/:id/activar
 * Reactiva. Acceso: solo administrador
 */
async function activar(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, message: 'ID inválido' });
    }
    const ok = await productoModel.activar(id);
    if (!ok) {
      return res.status(404).json({ ok: false, message: 'Producto no encontrado' });
    }
    res.json({ ok: true, message: 'Producto activado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtenerPorId, crear, actualizar, desactivar, activar };