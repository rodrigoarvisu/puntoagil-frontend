import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { comprasApi } from '../api/compras';
import { productosApi } from '../api/productos';
import type { Compra, Producto } from '../types';

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    Promise.all([comprasApi.listarTodas(), productosApi.listarTodos()]).then(
      ([resCompras, resProductos]) => {
        setCompras(resCompras.data);
        setProductos(resProductos.data);
        setCargando(false);
      }
    );
  }, []);

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
          className="bg-[#1D4ED8] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a44c0] transition"
        >
          + Nueva compra
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Cargando...</td></tr>
            ) : compras.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin compras registradas</td></tr>
            ) : (
              compras.map((c) => (
                <tr
                 key={c.id}
                 onClick={() => c.id && abrirDetalle(c.id)}
                 className="border-t border-slate-100 cursor-pointer hover:bg-[#F1F5F9] transition"
                >
                  <td className="px-4 py-3 text-slate-600">
                    {c.fecha ? new Date(c.fecha).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {(c.proveedor as any)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.detalles.length}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">${c.total?.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            ) : compraSeleccionada && (
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
                        <td className="px-3 py-2 text-slate-600">${d.costoUnitario.toFixed(2)}</td>
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
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}