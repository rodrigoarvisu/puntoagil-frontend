import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { ChevronDown } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { comprasApi } from '../api/compras';
import { productosApi } from '../api/productos';
import type { Compra, Producto } from '../types';

const notyf = new Notyf();

// Se usa en el select "Mostrar registros por página"
const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';

// Controles de la barra de filtros (mismo diseño que Productos y Ventas)
const filtroClass =
  'w-full h-10 border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 text-sm text-slate-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';
const selectClass = filtroClass + ' appearance-none pr-9';
const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5';

type Periodo = 'todo' | 'hoy' | 'ayer' | '7dias' | 'mes' | 'mesPasado' | 'personalizado';

type FiltrosCompras = {
  proveedor: number | '';
  periodo: Periodo;
  desde: string;
  hasta: string;
  producto: number | '';
};

const filtrosVacios: FiltrosCompras = {
  proveedor: '',
  periodo: 'todo',
  desde: '',
  hasta: '',
  producto: '',
};

/* ───────── Helpers de fechas ───────── */

const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sumarDias = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// 'YYYY-MM-DD' → fecha local (evita el desfase de zona horaria de new Date('YYYY-MM-DD'))
const parseFechaLocal = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Devuelve [inicio (inclusive), fin (exclusivo)] en milisegundos; null = sin límite
const rangoPeriodo = (
  periodo: Periodo,
  desde: string,
  hasta: string
): [number | null, number | null] => {
  const hoy = inicioDia(new Date());
  switch (periodo) {
    case 'hoy':
      return [hoy.getTime(), sumarDias(hoy, 1).getTime()];
    case 'ayer':
      return [sumarDias(hoy, -1).getTime(), hoy.getTime()];
    case '7dias':
      return [sumarDias(hoy, -6).getTime(), sumarDias(hoy, 1).getTime()];
    case 'mes':
      return [
        new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime(),
        new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1).getTime(),
      ];
    case 'mesPasado':
      return [
        new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).getTime(),
        new Date(hoy.getFullYear(), hoy.getMonth(), 1).getTime(),
      ];
    case 'personalizado':
      return [
        desde ? parseFechaLocal(desde).getTime() : null,
        hasta ? sumarDias(parseFechaLocal(hasta), 1).getTime() : null,
      ];
    default:
      return [null, null];
  }
};

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Filtros en edición (lo que el usuario está escogiendo)
  const [filtros, setFiltros] = useState<FiltrosCompras>(filtrosVacios);
  // Filtros aplicados (lo que realmente filtra la tabla)
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosCompras>(filtrosVacios);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [resCompras, resProductos] = await Promise.all([
          comprasApi.listarTodas(),
          productosApi.listarTodos(),
        ]);
        setCompras(resCompras.data);
        setProductos(resProductos.data);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  // Reinicia a la página 1 cuando cambian los datos, el tamaño de página o los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [compras.length, registrosPorPagina, filtrosAplicados]);

  /* ───────── Opciones de los selects ───────── */

  // Proveedores únicos sacados de las propias compras
  const proveedores = Array.from(
    new Map(
      compras
        .filter((c) => (c.proveedor as any)?.id != null)
        .map((c) => [
          (c.proveedor as any).id as number,
          ((c.proveedor as any).nombre as string) ?? `#${(c.proveedor as any).id}`,
        ])
    ).entries()
  )
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));

  /* ───────── Filtrado ───────── */

  const [inicioRango, finRango] = rangoPeriodo(
    filtrosAplicados.periodo,
    filtrosAplicados.desde,
    filtrosAplicados.hasta
  );

  const hayFiltros =
    filtrosAplicados.proveedor !== '' ||
    filtrosAplicados.periodo !== 'todo' ||
    filtrosAplicados.producto !== '';

  const comprasOrdenadas = [...compras].sort((a, b) => {
    const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
    const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
    return fechaB - fechaA;
  });

  const comprasFiltradas = comprasOrdenadas.filter((c) => {
    const t = c.fecha ? new Date(c.fecha).getTime() : null;

    const coincideProveedor =
      filtrosAplicados.proveedor === '' ||
      (c.proveedor as any)?.id === filtrosAplicados.proveedor;

    const coincidePeriodo =
      (inicioRango === null && finRango === null) ||
      (t !== null &&
        (inicioRango === null || t >= inicioRango) &&
        (finRango === null || t < finRango));

    const coincideProducto =
      filtrosAplicados.producto === '' ||
      c.detalles?.some((d) => d.producto?.id === filtrosAplicados.producto);

    return coincideProveedor && coincidePeriodo && coincideProducto;
  });

  /* ───────── Paginación (sobre lo filtrado) ───────── */

  const totalPaginas = Math.max(1, Math.ceil(comprasFiltradas.length / registrosPorPagina));
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const comprasPagina = comprasFiltradas.slice(indiceInicio, indiceInicio + registrosPorPagina);

  const irAPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
  };

  /* ───────── Acciones ───────── */

  const aplicarFiltros = () => {
    if (
      filtros.periodo === 'personalizado' &&
      filtros.desde &&
      filtros.hasta &&
      filtros.desde > filtros.hasta
    ) {
      notyf.error('La fecha "Desde" no puede ser posterior a "Hasta".');
      return;
    }
    setFiltrosAplicados(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosVacios);
    setFiltrosAplicados(filtrosVacios);
  };

  const abrirDetalle = async (id: number) => {
    setCargandoDetalle(true);
    try {
      const res = await comprasApi.buscarPorId(id);
      setCompraSeleccionada(res.data);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const nombreProducto = (productoId: number) =>
    productos.find((p) => p.id === productoId)?.nombre ?? `#${productoId}`;

  return (
    <MainLayout titulo="Compras">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Historial de compras</h2>
        <Link
          to="/compras/nueva"
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition mi-boton"
        >
          + Nueva compra
        </Link>
      </div>

      {/* ───────── Filtros ───────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          aplicarFiltros();
        }}
        className="bg-white rounded-xl border border-[#0F1E3D] p-4 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <div>
            <label htmlFor="f-proveedor" className={labelClass}>
              Proveedor
            </label>
            <div className="relative">
              <select
                id="f-proveedor"
                value={filtros.proveedor}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    proveedor: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className={selectClass}
              >
                <option value="">Todos</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="f-periodo" className={labelClass}>
              Periodo
            </label>
            <div className="relative">
              <select
                id="f-periodo"
                value={filtros.periodo}
                onChange={(e) =>
                  setFiltros({ ...filtros, periodo: e.target.value as Periodo })
                }
                className={selectClass}
              >
                <option value="todo">Todo el historial</option>
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="7dias">Últimos 7 días</option>
                <option value="mes">Este mes</option>
                <option value="mesPasado">Mes pasado</option>
                <option value="personalizado">Personalizado…</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="f-producto" className={labelClass}>
              Producto
            </label>
            <div className="relative">
              <select
                id="f-producto"
                value={filtros.producto}
                onChange={(e) =>
                  setFiltros({
                    ...filtros,
                    producto: e.target.value ? Number(e.target.value) : '',
                  })
                }
                className={selectClass}
              >
                <option value="">Todos</option>
                {productosOrdenados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-10 bg-[#1D4ED8] text-white px-4 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition whitespace-nowrap"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="h-10 px-3 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Rango personalizado: solo aparece cuando se elige "Personalizado" */}
        {filtros.periodo === 'personalizado' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-3 mt-3">
            <div>
              <label htmlFor="f-desde" className={labelClass}>
                Desde
              </label>
              <input
                id="f-desde"
                type="date"
                value={filtros.desde}
                max={filtros.hasta || undefined}
                onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
                className={filtroClass}
              />
            </div>
            <div>
              <label htmlFor="f-hasta" className={labelClass}>
                Hasta
              </label>
              <input
                id="f-hasta"
                type="date"
                value={filtros.hasta}
                min={filtros.desde || undefined}
                onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
                className={filtroClass}
              />
            </div>
          </div>
        )}
      </form>

      {/* ───────── Tabla ───────── */}
      <div className="bg-white rounded-xl border border-[#0F1E3D] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Cargando...
                </td>
              </tr>
            ) : comprasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  {hayFiltros
                    ? 'Sin compras con los filtros seleccionados'
                    : 'Sin compras registradas'}
                </td>
              </tr>
            ) : (
              comprasPagina.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => c.id && abrirDetalle(c.id)}
                  className="border-t border-slate-300 cursor-pointer hover:bg-[#F1F5F9] transition"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {c.fecha ? new Date(c.fecha).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {(c.proveedor as any)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.detalles.length}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    ${c.total?.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* --- Controles de paginación --- */}
        {!cargando && comprasFiltradas.length > 0 && (
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
                Página <span className="font-medium text-slate-800">{paginaActual}</span> de{' '}
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
              {Math.min(indiceInicio + registrosPorPagina, comprasFiltradas.length)} de{' '}
              {comprasFiltradas.length}
            </div>
          </div>
        )}
      </div>

      {/* ───────── Modal de detalle ───────── */}
      {(compraSeleccionada || cargandoDetalle) && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setCompraSeleccionada(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {cargandoDetalle ? (
              <p className="text-center text-slate-400 py-8">Cargando detalle...</p>
            ) : (
              compraSeleccionada && (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Compra #{compraSeleccionada.id}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {compraSeleccionada.fecha
                          ? new Date(compraSeleccionada.fecha).toLocaleString('es-MX')
                          : '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => setCompraSeleccionada(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 mb-4">
                    Proveedor:{' '}
                    <span className="font-medium text-slate-800">
                      {(compraSeleccionada.proveedor as any)?.nombre ?? '—'}
                    </span>
                  </p>

                  <table className="w-full text-sm mb-4">
                    <thead className="bg-slate-50 text-slate-500 text-left">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2">Cantidad</th>
                        <th className="px-3 py-2">Costo unit.</th>
                        <th className="px-3 py-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compraSeleccionada.detalles.map((d, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-800">
                            {nombreProducto(d.producto.id)}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{d.cantidad}</td>
                          <td className="px-3 py-2 text-slate-600">
                            ${d.costoUnitario.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-slate-600">
                            ${(d.subtotal ?? d.cantidad * d.costoUnitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-3">
                    <span>Total</span>
                    <span>${compraSeleccionada.total?.toFixed(2)}</span>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}