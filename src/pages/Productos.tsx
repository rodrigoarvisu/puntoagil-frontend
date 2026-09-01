import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'
import MainLayout from '../components/layout/MainLayout';
import { productosApi } from '../api/productos';
import { categoriasApi } from '../api/categorias';
import type { Producto, Categoria } from '../types';


const notyf = new Notyf();

type ProductoForm = {
  nombre: string;
  codigoBarras: string;
  categoriaId: number | '';
  costo: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
};

const formVacio: ProductoForm = {
  nombre: '',
  codigoBarras: '',
  categoriaId: '',
  costo: 0,
  precioVenta: 0,
  stock: 0,
  stockMinimo: 0,
};

export default function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductoForm>(formVacio);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resProductos, resCategorias] = await Promise.all([
        productosApi.listarTodos(),
        categoriasApi.listarTodos(),
      ]);
      setProductos(resProductos.data);
      setCategorias(resCategorias.data);
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const productosFiltrados = productos.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarras?.toLowerCase().includes(q)
    );
  });

  const abrirCrear = () => {
    setEditandoId(null);
    setForm(formVacio);
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setEditandoId(producto.id);
    setForm({
      nombre: producto.nombre,
      codigoBarras: producto.codigoBarras ?? '',
      categoriaId: producto.categoria.id,
      costo: producto.costo,
      precioVenta: producto.precioVenta,
      stock: producto.stock,
      stockMinimo: producto.stockMinimo,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoriaId) return;

    const payload = {
      nombre: form.nombre,
      codigoBarras: form.codigoBarras || undefined,
      categoria: { id: Number(form.categoriaId) } as Categoria,
      costo: Number(form.costo),
      precioVenta: Number(form.precioVenta),
      stock: Number(form.stock),
      stockMinimo: Number(form.stockMinimo),
    };

    try {
      if (editandoId) {
        await productosApi.actualizar(editandoId, payload);
      } else {
        await productosApi.crear(payload);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch {
      setError('Error al guardar el producto. Verifica que el código de barras no este repetido.');
    }
  };

  const handleEliminar = async (id: number) => {
  const resultado = await Swal.fire({
    title: '¿Eliminar producto?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
  });

  if (!resultado.isConfirmed) return;

  try {
    await productosApi.eliminar(id);

    notyf.success({
        message: 'El producto se eliminó correctamente.',
        duration: 3000
    });

    cargarDatos();

  } catch {
   notyf.error({
   message: 'El producto no se pudo eliminar, puede que tenga ventas o compras registradas.',
   duration: 4000
   });
  }
};

  return (
    <MainLayout titulo="Productos">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Inventario de productos</h2>
        <input
            type="text"
            placeholder="Buscar por nombre o escanear código de barras..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
          />
        <button
          onClick={abrirCrear}
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nuevo producto
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
              <th className="px-4 py-3">Código de barras</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Precio venta</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : productosFiltrados.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                {busqueda ? 'Sin resultados para tu búsqueda' : 'Sin productos registrados'}
              </td></tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.codigoBarras || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{p.categoria?.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">${p.costo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">${p.precioVenta.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= p.stockMinimo ? 'text-red-600 font-medium' : 'text-slate-600'}>
                      {p.stock}
                    </span>
                  </td>
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
              {editandoId ? 'Editar producto' : 'Nuevo producto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
             <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Código de barras
             </label>
              <input
                placeholder="Escanea o escribe el código de barras"
                value={form.codigoBarras}
                onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                autoFocus
              />
             <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nombre
             </label>
              <input
                required
                placeholder="Ingresa el nombre del producto"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
              />
               <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Categoría
                    </label>
              <select
                required
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
              >
                <option value="">Selecciona categoría</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Costo
                    </label>
                    <input 
                        required 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.costo}
                        onChange={(e) =>
                           setForm({ ...form, costo: Number(e.target.value) })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Precio venta
                    </label>
                    <input 
                        required 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.precioVenta}
                        onChange={(e) =>
                           setForm({ ...form, precioVenta: Number(e.target.value) })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Stock
                    </label>
                    <input 
                        required 
                        type="number"
                        step="0"
                        placeholder="0.00"
                        value={form.stock}
                        onChange={(e) =>
                           setForm({ ...form, stock: Number(e.target.value) })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Stock mínimo
                    </label>
                    <input 
                        required 
                        type="number"
                        step="0"
                        placeholder="0.00"
                        value={form.stockMinimo}
                        onChange={(e) =>
                           setForm({ ...form, stockMinimo: Number(e.target.value) })
                        }
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-[#F1F5F9]"
                    />
                </div>
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