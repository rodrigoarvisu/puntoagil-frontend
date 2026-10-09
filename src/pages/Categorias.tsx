import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'
import MainLayout from '../components/layout/MainLayout';
import { categoriasApi } from '../api/categorias';
import type { Categoria } from '../types';

const formVacio = { nombre: '', descripcion: '' };
const notyf = new Notyf();

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';


export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

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

  const totalPaginas = Math.max(1, Math.ceil(categorias.length / registrosPorPagina));
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const categoriasPagina = categorias.slice(indiceInicio, indiceInicio + registrosPorPagina);

  const irAPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
  }

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
      <h2 className="text-xl font-semibold text-slate-800">
        Categorías de productos
      </h2>
      <button
        onClick={abrirCrear}
        className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition mi-boton"
      >
        + Nueva categoría
      </button>
    </div>

    {error && (
      <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
        {error}
      </div>
    )}

    <div className="bg-white rounded-xl border border-[#0F1E3D] overflow-hidden">
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
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                Cargando...
              </td>
            </tr>
          ) : categorias.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                Sin categorías registradas
              </td>
            </tr>
          ) : (
            categoriasPagina.map((c) => (
              <tr key={c.id} className="border-t border-slate-300">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {c.nombre}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.descripcion || "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => abrirEditar(c)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(c.id)}
                    className="text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!cargando && categorias.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-slate-500 bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Mostrar</span>
            <select
              value={registrosPorPagina}
              onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
              className={inputClass} 
            >
              {[10, 20, 30, 50].map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            <span>registros por página</span>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => irAPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <span className="px-3 text-slate-600">
              Página{" "}
              <span className="font-medium text-slate-800">{paginaActual}</span>{" "}
              de{" "}
              <span className="font-medium text-slate-800">{totalPaginas}</span>
            </span>

            <button
              onClick={() => irAPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>

          <div className="text-sm text-slate-500">
            Mostrando {indiceInicio + 1}–
            {Math.min(indiceInicio + registrosPorPagina, categorias.length)} de{" "}
            {categorias.length}
          </div>
        </div>
      )}
    </div>

    {modalAbierto && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {editandoId ? "Editar categoría" : "Nueva categoría"}
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
              className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
              autoFocus
            />

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripción
            </label>
            <textarea
              placeholder="Ingresa una breve descripción (opcional)"
              value={form.descripcion}
              onChange={(e) =>
                setForm({ ...form, descripcion: e.target.value })
              }
              className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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