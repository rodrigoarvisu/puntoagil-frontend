import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import MainLayout from '../components/layout/MainLayout';
import { proveedoresApi } from '../api/proveedores';
import type { Proveedor } from '../types';

const formVacio = { nombre: '', telefono: '', email: '' };
const notyf = new Notyf();

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await proveedoresApi.listarTodos();
      setProveedores(res.data);
    } catch {
      setError('No se pudieron cargar los proveedores');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (proveedor: Proveedor) => {
    setEditandoId(proveedor.id);
    setForm({
      nombre: proveedor.nombre,
      telefono: proveedor.telefono ?? '',
      email: proveedor.email ?? '',
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await proveedoresApi.actualizar(editandoId, form);
      } else {
        await proveedoresApi.crear(form);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch {
      setError('Error al guardar el proveedor');
    }
  };

  const handleEliminar = async (id: number) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!resultado.isConfirmed) return;

    try {
      await proveedoresApi.eliminar(id);
      notyf.success({ message: 'El proveedor se eliminó correctamente.', duration: 3000 });
      cargarDatos();
    } catch {
      notyf.error({
        message: 'El proveedor no se pudo eliminar, puede que tenga compras registradas.',
        duration: 4000,
      });
    }
  };

  return (
    <MainLayout titulo="Proveedores">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Proveedores</h2>
        <button
          onClick={abrirCrear}
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nuevo proveedor
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : proveedores.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin proveedores registrados</td></tr>
            ) : (
              proveedores.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefono || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => abrirEditar(p)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleEliminar(p.id)} className="text-red-600 hover:underline">Eliminar</button>
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
              {editandoId ? 'Editar proveedor' : 'Nuevo proveedor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre</label>
              <input
                required
                placeholder="Ingresa el nombre del proveedor"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                autoFocus
              />
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
              <input
                placeholder="Ingresa el teléfono (opcional)"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
              />
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="Ingresa el email (opcional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
              />
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