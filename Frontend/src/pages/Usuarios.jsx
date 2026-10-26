import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Usuarios() {
  const { usuario: usuarioLogueado } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  
  // Formulario (incluye password solo al crear)
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '', rol_id: 2 });

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      // Asumimos que los roles ya existen (1: admin, 2: vendedor)
      const res = await api.get('/usuarios');
      setUsuarios(res.data.data);
      setRoles([{ id: 1, nombre: 'administrador' }, { id: 2, nombre: 'vendedor' }]);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setCargando(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setFormData({ nombre: '', email: '', password: '', rol_id: 2 });
    setModalAbierto(true);
  }

  function abrirEditar(user) {
    setEditando(user);
    setFormData({ nombre: user.nombre, email: user.email, password: '', rol_id: user.rol_id });
    setModalAbierto(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, {
          nombre: formData.nombre,
          email: formData.email,
          rol_id: formData.rol_id
        });
        setExito('Usuario actualizado');
      } else {
        await api.post('/usuarios', formData);
        setExito('Usuario creado');
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  }

  async function toggleActivo(user) {
    if (user.id === usuarioLogueado.id) {
      setError('No puedes desactivar tu propio usuario');
      return;
    }
    try {
      if (user.activo === 1) {
        await api.delete(`/usuarios/${user.id}`);
        setExito('Usuario desactivado');
      } else {
        await api.patch(`/usuarios/${user.id}/activar`);
        setExito('Usuario activado');
      }
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
    }
  }

  useEffect(() => {
    if (exito || error) {
      const timer = setTimeout(() => { setExito(''); setError(''); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exito, error]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>👥 Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={abrirCrear}>
          ➕ Nuevo usuario
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {cargando ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className={u.activo === 0 ? 'table-secondary' : ''}>
                    <td>{u.id}</td>
                    <td>{u.nombre}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.rol_nombre === 'administrador' ? 'bg-dark' : 'bg-info text-dark'}`}>
                        {u.rol_nombre}
                      </span>
                    </td>
                    <td>
                      {u.activo === 1 ? <span className="badge bg-success">Activo</span> : <span className="badge bg-secondary">Inactivo</span>}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => abrirEditar(u)}>
                        ✏️ Editar
                      </button>
                      <button
                        className={`btn btn-sm ${u.activo === 1 ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => toggleActivo(u)}
                      >
                        {u.activo === 1 ? '🚫 Desactivar' : '✅ Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editando ? 'Editar usuario' : 'Nuevo usuario'}</h5>
                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre completo *</label>
                    <input type="text" className="form-control" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correo electrónico *</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  {!editando && (
                    <div className="mb-3">
                      <label className="form-label">Contraseña *</label>
                      <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Rol *</label>
                    <select className="form-select" value={formData.rol_id} onChange={(e) => setFormData({ ...formData, rol_id: Number(e.target.value) })} required>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editando ? 'Guardar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;