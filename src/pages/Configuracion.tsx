import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { usuariosApi, type UsuarioData } from '../api/usuarios';
import { useAuth } from '../context/AuthContext';

const notyf = new Notyf();
const formVacio = { nombre: '', email: '', password: '', rol: 'CAJERO' as 'ADMIN' | 'CAJERO' };

export default function Configuracion() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    const res = await usuariosApi.listarTodos();
    setUsuarios(res.data);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setError('');
    setModalAbierto(true);
  };

  const abrirEditar = (u: UsuarioData) => {
    setEditandoId(u.id);
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    setError('');
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await usuariosApi.actualizar(editandoId, { nombre: form.nombre, email: form.email, rol: form.rol });
        notyf.success({ message: 'Usuario actualizado correctamente.', duration: 3000 });
      } else {
        await usuariosApi.crear(form);
        notyf.success({ message: 'Usuario creado correctamente.', duration: 3000 });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje || 'Error al guardar el usuario.');
    }
  };

  const handleCambiarEstado = async (u: UsuarioData) => {
    if (u.id === usuarioActual?.id) {
      notyf.error({ message: 'No puedes desactivar tu propia cuenta.', duration: 3500 });
      return;
    }

    const accion = u.activo ? 'desactivar' : 'activar';
    const resultado = await Swal.fire({
      title: `¿${accion === 'desactivar' ? 'Desactivar' : 'Activar'} usuario?`,
      text: `${u.nombre} ${accion === 'desactivar' ? 'ya no podrá iniciar sesión' : 'podrá volver a iniciar sesión'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
    });
    if (!resultado.isConfirmed) return;

    try {
      await usuariosApi.cambiarEstado(u.id, !u.activo);
      notyf.success({ message: `Usuario ${accion === 'desactivar' ? 'desactivado' : 'activado'} correctamente.`, duration: 3000 });
      cargarDatos();
    } catch {
      notyf.error({ message: 'No se pudo cambiar el estado del usuario.', duration: 3500 });
    }
  };

  return (
    <MainLayout titulo="Configuración">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Usuarios del sistema</h2>
        <button
          onClick={abrirCrear}
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Sin usuarios registrados</td></tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nombre} {u.id === usuarioActual?.id && <span className="text-xs text-slate-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.rol === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                      {u.rol === 'ADMIN' ? 'Administrador' : 'Cajero'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.activo ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => abrirEditar(u)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleCambiarEstado(u)} className="text-red-600 hover:underline">
                      {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editandoId ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {!editandoId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm({ ...form, rol: e.target.value as 'ADMIN' | 'CAJERO' })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="CAJERO">Cajero</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}