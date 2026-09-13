import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { productosApi } from '../api/productos';
import { ventasApi } from '../api/ventas';
import { comprasApi } from '../api/compras';
import { aperturaCajaApi, type AperturaCajaData } from '../api/aperturaCaja';
import { useAuth } from '../context/AuthContext';
import { esHoy, topProductosVendidos, utilidadDeVenta, serieUltimosNDias } from '../utils/reportes';
import type { Producto, Venta, Compra } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [apertura, setApertura] = useState<AperturaCajaData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [modalStock, setModalStock] = useState<'agotados' | 'poragotarse' | 'todos' | null>(null);

  useEffect(() => {
    Promise.all([
      productosApi.listarTodos(),
      ventasApi.listarTodas(),
      comprasApi.listarTodas(),
      aperturaCajaApi.obtenerActiva().catch(() => ({ status: 204, data: null })),
    ]).then(([resProductos, resVentas, resCompras, resApertura]) => {
      setProductos(resProductos.data);
      setVentas(resVentas.data);
      setCompras(resCompras.data);
      setApertura(resApertura.status === 200 ? resApertura.data : null);
      setCargando(false);
    });
  }, []);

  const ventasHoy = ventas.filter((v) => esHoy(v.fecha));
  const comprasHoy = compras.filter((c) => esHoy(c.fecha));

  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + (v.total ?? 0), 0);
  const totalComprasHoy = comprasHoy.reduce((acc, c) => acc + (c.total ?? 0), 0);
  const utilidadHoy = ventasHoy.reduce((acc, v) => acc + utilidadDeVenta(v), 0);

  const agotados = productos.filter((p) => p.stock === 0);
  const porAgotarse = productos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo);
  const topHoy = topProductosVendidos(ventasHoy, 5);

  const serieVentas = serieUltimosNDias(ventas, 7, (v) => v.total ?? 0);
  const serieUtilidad = serieUltimosNDias(ventas, 7, utilidadDeVenta);

  const ventasAyer = serieVentas[serieVentas.length - 2]?.valor ?? 0;
  const utilidadAyer = serieUtilidad[serieUtilidad.length - 2]?.valor ?? 0;

  const deltaVentas = ventasAyer > 0 ? ((totalVentasHoy - ventasAyer) / ventasAyer) * 100 : null;
  const deltaUtilidad = utilidadAyer > 0 ? ((utilidadHoy - utilidadAyer) / utilidadAyer) * 100 : null;

  const hoyTexto = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <MainLayout titulo="Dashboard">
      {cargando ? (
        <p className="text-center text-slate-400 py-12">Cargando...</p>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">¡Bienvenido, {usuario?.nombre}!</h2>
            <p className="text-slate-500 capitalize">Resumen general de tu negocio hoy · {hoyTexto}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <CardResumen
              titulo="Ventas del día"
              valor={`$${totalVentasHoy.toFixed(2)}`}
              delta={deltaVentas}
              comparativo={`vs. ayer $${ventasAyer.toFixed(2)}`}
              serie={serieVentas}
              colorFondo="bg-blue-50" colorIcono="text-blue-600" colorLinea="#1D4ED8"
              icono="carrito"
            />
            <CardResumen
              titulo="Utilidad del día"
              valor={`$${utilidadHoy.toFixed(2)}`}
              delta={deltaUtilidad}
              comparativo={`vs. ayer $${utilidadAyer.toFixed(2)}`}
              serie={serieUtilidad}
              colorFondo="bg-green-50" colorIcono="text-green-600" colorLinea="#059669"
              icono="dinero"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <CardAlerta titulo="Agotados" cantidad={agotados.length} colorFondo="bg-red-50" colorBorde="border-red-100" colorTexto="text-red-600" onClick={() => setModalStock('agotados')} />
            <CardAlerta titulo="Por agotarse" cantidad={porAgotarse.length} colorFondo="bg-amber-50" colorBorde="border-amber-100" colorTexto="text-amber-600" onClick={() => setModalStock('poragotarse')} />
            <CardAlerta titulo="Todos registrados" cantidad={productos.length} colorFondo="bg-blue-50" colorBorde="border-blue-100" colorTexto="text-blue-600" onClick={() => setModalStock('todos')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <PanelGrafica titulo="Ventas" etiqueta="Ventas totales" total={serieVentas.reduce((a, s) => a + s.valor, 0)} serie={serieVentas} color="#1D4ED8" />
            <PanelGrafica titulo="Utilidades" etiqueta="Utilidad total" total={serieUtilidad.reduce((a, s) => a + s.valor, 0)} serie={serieUtilidad} color="#059669" />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Productos más vendidos hoy</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-2">Producto</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Ventas</th>
                </tr>
              </thead>
              <tbody>
                {topHoy.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Aún no hay ventas hoy</td></tr>
                ) : (
                  topHoy.map((p) => (
                    <tr key={p.nombre} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-800">{p.nombre}</td>
                      <td className="px-4 py-2 text-slate-600">{p.cantidad}</td>
                      <td className="px-4 py-2 text-slate-600">${p.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalStock && (
        <ModalStock
          tipo={modalStock}
          productos={modalStock === 'agotados' ? agotados : modalStock === 'poragotarse' ? porAgotarse : productos}
          onClose={() => setModalStock(null)}
        />
      )}
    </MainLayout>
  );
}

function CardResumen({
  titulo, valor, delta, comparativo, serie, colorFondo, colorIcono, colorLinea, icono,
}: {
  titulo: string; valor: string; delta: number | null; comparativo: string;
  serie: { fecha: string; valor: number }[]; colorFondo: string; colorIcono: string; colorLinea: string; icono: 'carrito' | 'dinero';
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${colorFondo} ${colorIcono}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icono === 'carrito' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <div>
          <p className="text-sm text-slate-500">{titulo}</p>
          <p className="text-2xl font-bold text-slate-800">{valor}</p>
        </div>
      </div>

      {delta !== null && (
        <p className={`text-sm font-medium mb-1 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
        </p>
      )}
      <p className="text-xs text-slate-400 mb-3">{comparativo}</p>

      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={serie}>
          <Line type="monotone" dataKey="valor" stroke={colorLinea} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function PanelGrafica({ titulo, etiqueta, total, serie, color }: { titulo: string; etiqueta: string; total: number; serie: { fecha: string; valor: number }[]; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-sm font-semibold text-slate-700">{titulo}</h3>
        <span className="text-xs text-slate-400">Últimos 7 días</span>
      </div>
      <p className="text-xs text-slate-400 mb-1">{etiqueta}</p>
      <p className="text-xl font-bold text-slate-800 mb-4">${total.toFixed(2)}</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={serie}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="fecha" tick={{ fontSize: 11 }} tickFormatter={(f) => f.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
          <Line type="monotone" dataKey="valor" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <Link to="/reportes" className="text-sm text-[#1D4ED8] hover:underline mt-3 inline-block">
        Ver reporte completo →
      </Link>
    </div>
  );
}

function CardAlerta({ titulo, cantidad, colorFondo, colorBorde, colorTexto, onClick }: { titulo: string; cantidad: number; colorFondo: string; colorBorde: string; colorTexto: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-left rounded-xl border p-5 hover:shadow-md transition ${colorFondo} ${colorBorde}`}>
      <p className={`text-sm font-medium ${colorTexto}`}>{titulo}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{cantidad}</p>
      <p className="text-xs text-slate-500 mt-1">productos</p>
    </button>
  );
}

function ModalStock({ tipo, productos, onClose }: { tipo: string; productos: Producto[]; onClose: () => void }) {
  const titulos: Record<string, string> = { agotados: 'Productos agotados', poragotarse: 'Productos por agotarse', todos: 'Todos los productos' };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">{titulos[tipo]}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        {productos.length === 0 ? (
          <p className="text-center text-slate-400 py-8">Sin productos en esta categoría</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr><th className="px-3 py-2">Producto</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Mínimo</th></tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-3 py-2 text-slate-600">{p.stock}</td>
                  <td className="px-3 py-2 text-slate-600">{p.stockMinimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}