import { useState, useEffect } from 'react';
import api from '../services/api';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Modal de nueva venta
  const [modalNueva, setModalNueva] = useState(false);
  const [productoSel, setProductoSel] = useState('');
  const [cantidadSel, setCantidadSel] = useState(1);
  const [cart, setCart] = useState([]);
  const [impuestoPct, setImpuestoPct] = useState(0.18);

  // Modal de comprobante
  const [ventaDetalle, setVentaDetalle] = useState(null);

  useEffect(() => {
    cargarVentas();
    cargarProductos();
  }, []);

  async function cargarVentas() {
    try {
      setCargando(true);
      const res = await api.get('/ventas');
      setVentas(res.data.data);
      setError('');
    } catch (err) {
      setError('Error al cargar ventas');
    } finally {
      setCargando(false);
    }
  }

  async function cargarProductos() {
    try {
      const res = await api.get('/productos');
      setProductos(res.data.data.filter(p => p.activo === 1 && p.stock > 0));
    } catch (err) {
      console.error('Error cargando productos', err);
    }
  }

  // --- Carrito ---
  function agregarAlCarrito() {
    if (!productoSel || cantidadSel <= 0) return;

    const producto = productos.find(p => p.id === parseInt(productoSel));
    if (!producto) return;

    const existente = cart.find(item => item.producto_id === producto.id);
    const nuevaCantidad = (existente?.cantidad || 0) + parseInt(cantidadSel);

    if (nuevaCantidad > producto.stock) {
      alert(`Stock insuficiente. Disponible: ${producto.stock}`);
      return;
    }

    if (existente) {
      setCart(cart.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: nuevaCantidad }
          : item
      ));
    } else {
      setCart([...cart, {
        producto_id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio: parseFloat(producto.precio),
        cantidad: parseInt(cantidadSel),
        stock: producto.stock
      }]);
    }

    setProductoSel('');
    setCantidadSel(1);
  }

  function cambiarCantidad(productoId, nuevaCantidad) {
    const item = cart.find(i => i.producto_id === productoId);
    if (!item) return;

    const cant = parseInt(nuevaCantidad);
    if (cant <= 0) {
      setCart(cart.filter(i => i.producto_id !== productoId));
    } else if (cant > item.stock) {
      alert(`Stock insuficiente. Disponible: ${item.stock}`);
    } else {
      setCart(cart.map(i =>
        i.producto_id === productoId ? { ...i, cantidad: cant } : i
      ));
    }
  }

  function quitarDelCarrito(productoId) {
    setCart(cart.filter(i => i.producto_id !== productoId));
  }

  function calcularTotales() {
    const subtotal = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const impuesto = subtotal * impuestoPct;
    const total = subtotal + impuesto;
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      impuesto: Math.round(impuesto * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }

  async function confirmarVenta() {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const items = cart.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad
      }));

      const res = await api.post('/ventas', { items, impuesto_pct: impuestoPct });
      setExito(`Venta ${res.data.data.numero_venta} registrada`);
      setCart([]);
      setModalNueva(false);
      cargarVentas();
      cargarProductos();
      // Mostrar el comprobante automáticamente
      verComprobante(res.data.data.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar la venta');
    }
  }

  async function verComprobante(id) {
    try {
      const res = await api.get(`/ventas/${id}`);
      setVentaDetalle(res.data.data);
    } catch (err) {
      setError('Error al cargar comprobante');
    }
  }

  useEffect(() => {
    if (exito || error) {
      const timer = setTimeout(() => { setExito(''); setError(''); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [exito, error]);

  const totales = calcularTotales();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>🧾 Ventas</h1>
        <button className="btn btn-success" onClick={() => { setCart([]); setModalNueva(true); }}>
          ➕ Nueva venta
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {/* Tabla de ventas */}
      {cargando ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Número</th>
                  <th>Usuario</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">Impuesto</th>
                  <th className="text-end">Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  ventas.map((v) => (
                    <tr key={v.id}>
                      <td><code>{v.numero_venta}</code></td>
                      <td>{v.usuario_nombre}</td>
                      <td className="text-end">RD$ {parseFloat(v.subtotal).toFixed(2)}</td>
                      <td className="text-end">RD$ {parseFloat(v.impuesto).toFixed(2)}</td>
                      <td className="text-end"><strong>RD$ {parseFloat(v.total).toFixed(2)}</strong></td>
                      <td>
                        <span className={`badge ${v.estado === 'COMPLETADA' ? 'bg-success' : 'bg-danger'}`}>
                          {v.estado}
                        </span>
                      </td>
                      <td className="small text-muted">
                        {new Date(v.created_at).toLocaleString('es-DO')}
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => verComprobante(v.id)}>
                          🧾 Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nueva Venta */}
      {modalNueva && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🧾 Nueva venta</h5>
                <button type="button" className="btn-close" onClick={() => setModalNueva(false)}></button>
              </div>
              <div className="modal-body">
                {/* Agregar producto */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Producto</label>
                    <select
                      className="form-select"
                      value={productoSel}
                      onChange={(e) => setProductoSel(e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} - {p.nombre} (stock: {p.stock}, RD$ {parseFloat(p.precio).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Cantidad</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={cantidadSel}
                      onChange={(e) => setCantidadSel(e.target.value)}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button className="btn btn-outline-primary w-100" onClick={agregarAlCarrito}>
                      Agregar
                    </button>
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <select
                      className="form-select"
                      value={impuestoPct}
                      onChange={(e) => setImpuestoPct(parseFloat(e.target.value))}
                      title="Impuesto"
                    >
                      <option value="0.18">18%</option>
                      <option value="0.10">10%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                </div>

                {/* Carrito */}
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th className="text-end">Precio</th>
                        <th className="text-center">Cantidad</th>
                        <th className="text-end">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-muted py-3">
                            El carrito está vacío. Agrega productos arriba.
                          </td>
                        </tr>
                      ) : (
                        cart.map((item) => (
                          <tr key={item.producto_id}>
                            <td>
                              <code>{item.codigo}</code> - {item.nombre}
                            </td>
                            <td className="text-end">RD$ {item.precio.toFixed(2)}</td>
                            <td className="text-center" style={{ width: '100px' }}>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center"
                                value={item.cantidad}
                                min="1"
                                max={item.stock}
                                onChange={(e) => cambiarCantidad(item.producto_id, e.target.value)}
                              />
                            </td>
                            <td className="text-end">RD$ {(item.precio * item.cantidad).toFixed(2)}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => quitarDelCarrito(item.producto_id)}>
                                ✖
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="row justify-content-end">
                  <div className="col-md-5">
                    <table className="table table-sm mb-0">
                      <tbody>
                        <tr>
                          <td>Subtotal</td>
                          <td className="text-end">RD$ {totales.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td>Impuesto ({(impuestoPct * 100).toFixed(0)}%)</td>
                          <td className="text-end">RD$ {totales.impuesto.toFixed(2)}</td>
                        </tr>
                        <tr className="fw-bold">
                          <td>Total</td>
                          <td className="text-end">RD$ {totales.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalNueva(false)}>Cancelar</button>
                <button type="button" className="btn btn-success" onClick={confirmarVenta} disabled={cart.length === 0}>
                  ✅ Confirmar venta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprobante */}
      {ventaDetalle && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🧾 Comprobante</h5>
                <button type="button" className="btn-close" onClick={() => setVentaDetalle(null)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-1"><strong>{ventaDetalle.numero_venta}</strong></p>
                <p className="text-muted small">
                  {new Date(ventaDetalle.created_at).toLocaleString('es-DO')} · {ventaDetalle.usuario_nombre}
                </p>
                <hr />
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="text-center">Cant</th>
                      <th className="text-end">P. Unit</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaDetalle.detalles.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <code>{d.producto_codigo}</code>
                          <br />
                          <small>{d.producto_nombre}</small>
                        </td>
                        <td className="text-center">{d.cantidad}</td>
                        <td className="text-end">RD$ {parseFloat(d.precio_unitario).toFixed(2)}</td>
                        <td className="text-end">RD$ {parseFloat(d.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="table table-sm mb-0">
                  <tbody>
                    <tr><td>Subtotal</td><td className="text-end">RD$ {parseFloat(ventaDetalle.subtotal).toFixed(2)}</td></tr>
                    <tr><td>Impuesto</td><td className="text-end">RD$ {parseFloat(ventaDetalle.impuesto).toFixed(2)}</td></tr>
                    <tr className="fw-bold"><td>Total</td><td className="text-end">RD$ {parseFloat(ventaDetalle.total).toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setVentaDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ventas;