import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'
import MainLayout from '../components/layout/MainLayout';
import { categoriasApi } from '../api/categorias';
import type { Categoria } from '../types';

const formVacio = { nombre: '', descripcion: '' };
const notyf = new Notyf();

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await categoriasApi.listarTodos();
      setCategorias(res.data);
    } catch {
      setError('No se pudieron cargar las categorías');
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

  const abrirEditar = (categoria: Categoria) => {
    setEditandoId(categoria.id);
    setForm({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? '' });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editandoId) {
        await categoriasApi.actualizar(editandoId, form);
      } else {
        await categoriasApi.crear(form);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch {
      setError('Error al guardar la categoría');
    }
  };

  const handleEliminar = async (id: number) => {
    const resultado = await Swal.fire({
        title: '¿Eliminar categoría?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });

      if (!resultado.isConfirmed) return;

    try {
      await categoriasApi.eliminar(id);

      notyf.success({
        message: 'La categoría se eliminó correctamente.',
        duration: 3000
      });

      cargarDatos();

    } catch {
      notyf.error({
   message: 'La categoría no se pudo eliminar, puede que tenga productos asociados.',
   duration: 4000
   });
    }
  };

  return (
    <MainLayout titulo="Categorías">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Categorías de productos</h2>
        <button
          onClick={abrirCrear}
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nueva categoría
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
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : categorias.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin categorías registradas</td></tr>
            ) : (
              categorias.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{c.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => abrirEditar(c)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => handleEliminar(c.id)} className="text-red-600 hover:underline">Eliminar</button>
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
              {editandoId ? 'Editar categoría' : 'Nueva categoría'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nombre
              </label>
              <input
                required
                placeholder="Ingresa el nombre de la categoría"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                autoFocus
              />
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Descripción
             </label>
              <textarea
                placeholder="Ingresa una breve descripción (opcional)"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                rows={3}
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