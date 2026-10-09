import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css'
import MainLayout from '../components/layout/MainLayout';
import { productosApi } from '../api/productos';
import { categoriasApi } from '../api/categorias';
import type { Producto, Categoria } from '../types';
import { GooeyInput } from '@/components/ui/gooey-input';


const notyf = new Notyf();

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';


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

export default function Productos()  {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductoForm>(formVacio);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<number | ''>('');
  const [filtroStock, setFiltroStock] = useState<'todo' | 'menor3' | 'menor5' | 'menor10' | 'agotado'>('todo');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    categoria: '' as number | '',
    stock: 'todo' as typeof filtroStock,
    precioMin: '',
    precioMax: '',
  })
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

  useEffect(() => {
  setPaginaActual(1);
}, [productos.length, registrosPorPagina, busqueda, filtrosAplicados]);

  const productosFiltrados = productos.filter((p) => {
  const q = busqueda.toLowerCase().trim();
  const coincideBusqueda =
    !q || p.nombre.toLowerCase().includes(q) || p.codigoBarras?.toLowerCase().includes(q);

  const coincideCategoria =
    !filtrosAplicados.categoria || p.categoria.id === filtrosAplicados.categoria;

  const coincideStock =
    filtrosAplicados.stock === 'todo' ? true :
    filtrosAplicados.stock === 'agotado' ? p.stock === 0 :
    filtrosAplicados.stock === 'menor3' ? p.stock < 3 :
    filtrosAplicados.stock === 'menor5' ? p.stock < 5 :
    filtrosAplicados.stock === 'menor10' ? p.stock < 10 : true;

  const coincidePrecioMin = !filtrosAplicados.precioMin || p.precioVenta >= Number(filtrosAplicados.precioMin);
  const coincidePrecioMax = !filtrosAplicados.precioMax || p.precioVenta <= Number(filtrosAplicados.precioMax);

  return coincideBusqueda && coincideCategoria && coincideStock && coincidePrecioMin && coincidePrecioMax;
});

const totalPaginas = Math.max(1, Math.ceil(productos.length / registrosPorPagina));
const indiceInicio = (paginaActual - 1) * registrosPorPagina;
const productosPagina = productosFiltrados.slice(indiceInicio, indiceInicio + registrosPorPagina);

const irAPagina = (pagina: number) => {
  if (pagina < 1 || pagina > totalPaginas) return;
  setPaginaActual(pagina);
}

  const aplicarFiltros = () => {
  setFiltrosAplicados({ categoria: filtroCategoria, stock: filtroStock, precioMin, precioMax });
  };

const limpiarFiltros = () => {
  setFiltroCategoria('');
  setFiltroStock('todo');
  setPrecioMin('');
  setPrecioMax('');
  setFiltrosAplicados({ categoria: '', stock: 'todo', precioMin: '', precioMax: '' });
}; 

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
      <h2 className="text-xl font-semibold text-slate-800">
        Inventario de productos
      </h2>

      <GooeyInput
        placeholder="Buscar producto o escanear código de barras"
        value={busqueda}
        onValueChange={setBusqueda}
        autoFocus
        collapsedWidth={115}
        expandedWidth={350}
        classNames={{
          trigger:
            "!bg-[#BCD0FA] !text-slate-600 !ring-1 !ring-slate-200 !shadow-none",
          bubbleSurface: "!bg-[#0F1E3D] !text-white !ring-slate-200",
          input: "!text-slate-800 placeholder:!text-slate-450",
        }}
      />

      <button
        onClick={abrirCrear}
        className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition mi-boton"
      >
        + Nuevo producto
      </button>
    </div>

    <div className="bg-white rounded-xl border border-[#0F1E3D] p-4 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Categoría
          </label>
          <select
            value={filtroCategoria}
            onChange={(e) =>
              setFiltroCategoria(e.target.value ? Number(e.target.value) : "")
            }
            className={inputClass}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Stock
          </label>
          <select
            value={filtroStock}
            onChange={(e) =>
              setFiltroStock(e.target.value as typeof filtroStock)
            }
            className={inputClass}
          >
            <option value="todo">Todo</option>
            <option value="menor3">Menor a 3</option>
            <option value="menor5">Menor a 5</option>
            <option value="menor10">Menor a 10</option>
            <option value="agotado">Fuera de stock</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Precio mín.
          </label>
          <input
            type="number"
            min={0}
            placeholder="Ej. $0"
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Precio máx.
          </label>
          <input
            type="number"
            min={0}
            placeholder="Ej. $999"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={aplicarFiltros}
            className="flex-1 bg-[#1D4ED8] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
          >
            Aplicar filtros
          </button>
          <button
            onClick={limpiarFiltros}
            className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition"
          >
            Limpiar
          </button>
        </div>
      </div>
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
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                Cargando...
              </td>
            </tr>
          ) : productosFiltrados.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                {busqueda
                  ? "Sin resultados para tu búsqueda"
                  : "Sin productos registrados"}
              </td>
            </tr>
          ) : (
            productosPagina.map((p) => (
              <tr key={p.id} className="border-t border-slate-300">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {p.nombre}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {p.codigoBarras || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.categoria?.nombre}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  ${p.costo.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  ${p.precioVenta.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.stock <= p.stockMinimo
                        ? "text-red-600 font-medium"
                        : "text-slate-600"
                    }
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    onClick={() => abrirEditar(p)}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(p.id)}
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

      {!cargando && productosFiltrados.length > 0 && (
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
            Mostrando {productosFiltrados.length === 0 ? 0 : indiceInicio + 1}–
            {Math.min(
              indiceInicio + registrosPorPagina,
              productosFiltrados.length
            )}{" "}
            de {productosFiltrados.length}
          </div>
        </div>
      )}
    </div>

    {modalAbierto && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {editandoId ? "Editar producto" : "Nuevo producto"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Código de barras
            </label>
            <input
              placeholder="Escanea o escribe el código de barras"
              value={form.codigoBarras}
              onChange={(e) =>
                setForm({ ...form, codigoBarras: e.target.value })
              }
              className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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
              className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
            />

            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Categoría
            </label>
            <select
              required
              value={form.categoriaId}
              onChange={(e) =>
                setForm({ ...form, categoriaId: Number(e.target.value) })
              }
              className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
            >
              <option value="">Selecciona categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
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
                  className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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
                  className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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
                  className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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
                  className="border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]"
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