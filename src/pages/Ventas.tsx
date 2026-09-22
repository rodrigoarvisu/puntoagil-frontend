import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { ventasApi } from '../api/ventas';
import type { Venta } from '../types';

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';


export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  useEffect(() => {
    ventasApi.listarTodas().then((res) => {
      setVentas(res.data);
      setCargando(false);
    });
  }, []);

  const abrirDetalle = async (id: number) => {
    setCargandoDetalle(true);
    try {
      const res = await ventasApi.buscarPorId(id);
      setVentaSeleccionada(res.data);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Reinicia a la página 1 cuando cambian los datos o el tamaño de página
  useEffect(() => {
    setPaginaActual(1);
  }, [ventas.length, registrosPorPagina]);

  const totalPaginas = Math.max(1, Math.ceil(ventas.length / registrosPorPagina));
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const ventasPagina = ventas.slice(indiceInicio, indiceInicio + registrosPorPagina);

  const irAPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
  };

  return (
    <MainLayout titulo="Ventas">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Historial de ventas</h2>
        <Link
          to="/ventas/nueva"
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nueva venta
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#0F1E3D] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin ventas registradas</td></tr>
            ) : (
              ventasPagina.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => v.id && abrirDetalle(v.id)}
                  className="border-t border-slate-300 cursor-pointer hover:bg-[#F1F5F9] transition"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {v.fecha ? new Date(v.fecha).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {(v.usuario as any)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.detalles.length}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">${v.total?.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* --- Controles de paginación --- */}
        {!cargando && ventas.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 border-t border-slate-500 bg-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Mostrar</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                className={inputClass}
              >
                {[10, 20, 30, 50].map((opcion) => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
              <span>registros por página</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
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
                className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
              >
                Siguiente
              </button>
            </div>

            <div className="text-sm text-slate-500">
              Mostrando {indiceInicio + 1}–{Math.min(indiceInicio + registrosPorPagina, ventas.length)} de {ventas.length}
            </div>
          </div>
        )}
      </div>

      {(ventaSeleccionada || cargandoDetalle) && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setVentaSeleccionada(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {cargandoDetalle ? (
              <p className="text-center text-slate-400 py-8">Cargando detalle...</p>
            ) : ventaSeleccionada && (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      Venta #{ventaSeleccionada.id}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {ventaSeleccionada.fecha
                        ? new Date(ventaSeleccionada.fecha).toLocaleString('es-MX')
                        : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setVentaSeleccionada(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm text-slate-600 mb-4">
                  Vendedor:{' '}
                  <span className="font-medium text-slate-800">
                    {(ventaSeleccionada.usuario as any)?.nombre ?? '—'}
                  </span>
                </p>

                <table className="w-full text-sm mb-4">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2">Cantidad</th>
                      <th className="px-3 py-2">Precio unit.</th>
                      <th className="px-3 py-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaSeleccionada.detalles.map((d, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">
                          {(d.producto as any).nombre ?? `#${d.producto.id}`}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{d.cantidad}</td>
                        <td className="px-3 py-2 text-slate-600">${d.precioUnitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          ${(d.subtotal ?? d.cantidad * d.precioUnitario).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between text-lg font-bold text-slate-800 border-t border-slate-200 pt-3">
                  <span>Total</span>
                  <span>${ventaSeleccionada.total?.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}