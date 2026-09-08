import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { productosApi } from '../api/productos';
import { ventasApi } from '../api/ventas';
import { comprasApi } from '../api/compras';
import { aperturaCajaApi, type AperturaCajaData } from '../api/aperturaCaja';
import { useAuth } from '../context/AuthContext';
import { esHoy, topProductosVendidos } from '../utils/reportes';
import type { Producto, Venta, Compra } from '../types';

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
  const utilidadHoy = ventasHoy.reduce((acc, v) => {
    return acc + v.detalles.reduce((sub, d) => {
      const costo = (d.producto as any).costo ?? 0;
      const subtotal = d.subtotal ?? d.cantidad * d.precioUnitario;
      return sub + (subtotal - costo * d.cantidad);
    }, 0);
  }, 0);

  const agotados = productos.filter((p) => p.stock === 0);
  const porAgotarse = productos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo);

  const topHoy = topProductosVendidos(ventasHoy, 5);

  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <MainLayout titulo="Dashboard">
      {cargando ? (
        <p className="text-center text-slate-400 py-12">Cargando...</p>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">¡Bienvenido, {usuario?.nombre}!</h2>
            <p className="text-slate-500 capitalize">{hoy}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardKpi titulo="Ventas de hoy" valor={`$${totalVentasHoy.toFixed(2)}`} colorFondo="bg-blue-50" colorBorde="border-blue-100" colorTexto="text-blue-600" />
            <CardKpi titulo="Utilidad de hoy" valor={`$${utilidadHoy.toFixed(2)}`} colorFondo="bg-green-50" colorBorde="border-green-100" colorTexto="text-green-600" />
            <CardKpi titulo="Compras de hoy" valor={`$${totalComprasHoy.toFixed(2)}`} colorFondo="bg-red-50" colorBorde="border-red-100" colorTexto="text-red-600" />
            <CardKpi
              titulo="Estado de caja"
              valor={apertura ? 'Abierta' : 'Cerrada'}
              colorFondo={apertura ? 'bg-green-50' : 'bg-slate-100'}
              colorBorde={apertura ? 'border-green-100' : 'border-slate-200'}
              colorTexto={apertura ? 'text-green-600' : 'text-slate-500'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <CardAlerta
              titulo="Agotados"
              cantidad={agotados.length}
              colorFondo="bg-red-50" colorBorde="border-red-100" colorTexto="text-red-600"
              onClick={() => setModalStock('agotados')}
            />
            <CardAlerta
              titulo="Por agotarse"
              cantidad={porAgotarse.length}
              colorFondo="bg-amber-50" colorBorde="border-amber-100" colorTexto="text-amber-600"
              onClick={() => setModalStock('poragotarse')}
            />
            <CardAlerta
              titulo="Todos registrados"
              cantidad={productos.length}
              colorFondo="bg-blue-50" colorBorde="border-blue-100" colorTexto="text-blue-600"
              onClick={() => setModalStock('todos')}
            />
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
                  <th className="px-4 py-2">Total vendido</th>
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
          productos={
            modalStock === 'agotados' ? agotados : modalStock === 'poragotarse' ? porAgotarse : productos
          }
          onClose={() => setModalStock(null)}
        />
      )}
    </MainLayout>
  );
}

function CardKpi({ titulo, valor, colorFondo, colorBorde, colorTexto }: { titulo: string; valor: string; colorFondo: string; colorBorde: string; colorTexto: string }) {
  return (
    <div className={`rounded-xl border p-5 ${colorFondo} ${colorBorde}`}>
      <p className="text-sm text-slate-600 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${colorTexto}`}>{valor}</p>
    </div>
  );
}

function CardAlerta({ titulo, cantidad, colorFondo, colorBorde, colorTexto, onClick }: { titulo: string; cantidad: number; colorFondo: string; colorBorde: string; colorTexto: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-5 hover:shadow-md transition ${colorFondo} ${colorBorde}`}
    >
      <p className={`text-sm font-medium ${colorTexto}`}>{titulo}</p>
      <p className="text-3xl font-bold text-slate-800 mt-1">{cantidad}</p>
      <p className="text-xs text-slate-500 mt-1">productos</p>
    </button>
  );
}

function ModalStock({ tipo, productos, onClose }: { tipo: string; productos: Producto[]; onClose: () => void }) {
  const titulos: Record<string, string> = {
    agotados: 'Productos agotados',
    poragotarse: 'Productos por agotarse',
    todos: 'Todos los productos',
  };

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
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Mínimo</th>
              </tr>
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