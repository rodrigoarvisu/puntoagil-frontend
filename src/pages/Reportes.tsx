import { useEffect, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { productosApi } from '../api/productos';
import { ventasApi } from '../api/ventas';
import { comprasApi } from '../api/compras';
import { valuarStock } from '../utils/reportes';
import type { Producto, Venta, Compra } from '../types';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { filtrarPorRango, agruparPorDia, topProductosVendidos, topProductosComprados, totalPorMetodoPago, comprasPorProveedor, calcularUtilidadPorDia, topProductosPorUtilidad } from '../utils/reportes';

type Tab = 'ventas' | 'compras' | 'utilidades' | 'valuacion';

export default function Reportes() {
  const [tab, setTab] = useState<Tab>('valuacion');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      productosApi.listarTodos(),
      ventasApi.listarTodas(),
      comprasApi.listarTodas(),
    ]).then(([resProductos, resVentas, resCompras]) => {
      setProductos(resProductos.data);
      setVentas(resVentas.data);
      setCompras(resCompras.data);
      setCargando(false);
    });
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'valuacion', label: 'Valuación de stock' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'compras', label: 'Compras' },
    { id: 'utilidades', label: 'Utilidades' },
  ];

  return (
    <MainLayout titulo="Reportes">
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.id ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-center text-slate-400 py-12">Cargando datos...</p>
      ) : (
        <>
          {tab === 'valuacion' && <TabValuacion productos={productos} />}
          {tab === 'ventas' && <TabVentas ventas={ventas} />}
          {tab === 'compras' && <TabCompras compras={compras} />}
          {tab === 'utilidades' && <TabUtilidades ventas={ventas} />}
        </>
      )}
    </MainLayout>
  );
}

function TabValuacion({ productos }: { productos: Producto[] }) {
  const { valorCosto, valorVenta, utilidadPotencial, unidadesTotales } = valuarStock(productos);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card titulo="Valor a costo" valor={`$${valorCosto.toFixed(2)}`} sub="Lo que invertiste en tu inventario actual" />
        <Card titulo="Valor a precio de venta" valor={`$${valorVenta.toFixed(2)}`} sub="Si vendieras todo el stock hoy" />
        <Card titulo="Utilidad potencial" valor={`$${utilidadPotencial.toFixed(2)}`} sub="Ganancia si se vende todo" color="text-green-600" />
        <Card titulo="Unidades en stock" valor={unidadesTotales.toString()} sub="Total de piezas en inventario" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0F1E3D] text-white text-left">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Costo unitario</th>
              <th className="px-4 py-3">Valor a costo</th>
              <th className="px-4 py-3">Valor a venta</th>
            </tr>
          </thead>
          <tbody>
            {productos
              .filter((p) => p.stock > 0)
              .sort((a, b) => b.costo * b.stock - a.costo * a.stock)
              .map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{p.stock}</td>
                  <td className="px-4 py-3 text-slate-600">${p.costo.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">${(p.costo * p.stock).toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-600">${(p.precioVenta * p.stock).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardIcono({
  titulo, valor, colorFondo, colorIcono, colorBorde, icono,
}: { titulo: string; valor: string; colorFondo: string; colorIcono: string; colorBorde: string; icono: 'total' | 'efectivo' | 'tarjeta' | 'transferencia' }) {
  const icons: Record<typeof icono, React.ReactElement> = {
    total: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2" />,
    efectivo: <><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} /><circle cx="12" cy="12" r="2.5" strokeWidth={1.5} /></>,
    tarjeta: <><rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.5} /><line x1="2" y1="10" x2="22" y2="10" strokeWidth={1.5} /></>,
    transferencia: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />,
  };

  return (
    <div className={`rounded-xl border p-5 flex items-start gap-3 ${colorFondo} ${colorBorde}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white ${colorIcono}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[icono]}</svg>
      </div>
      <div>
        <p className="text-sm text-slate-600">{titulo}</p>
        <p className={`text-xl font-bold ${colorIcono}`}>{valor}</p>
      </div>
    </div>
  );
}

function Card({ titulo, valor, sub, color = 'text-slate-800' }: { titulo: string; valor: string; sub: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-sm text-slate-500 mb-1">{titulo}</p>
      <p className={`text-2xl font-bold ${color}`}>{valor}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

function TabVentas({ ventas }: { ventas: Venta[] }) {
  const [inicio, setInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [fin, setFin] = useState(() => new Date().toISOString().slice(0, 10));

  const ventasFiltradas = filtrarPorRango(ventas, inicio, fin + 'T23:59:59');
  const datosGrafica = agruparPorDia(ventasFiltradas);
  const top = topProductosVendidos(ventasFiltradas);
  const totalPeriodo = ventasFiltradas.reduce((acc, v) => acc + (v.total ?? 0), 0);
  const porMetodoPago = totalPorMetodoPago(ventasFiltradas);

  const datosDona = [
  { name: 'Efectivo', value: porMetodoPago.EFECTIVO, color: '#247fe0' },
  { name: 'Tarjeta', value: porMetodoPago.TARJETA, color: '#ab87ea' },
  { name: 'Transferencia', value: porMetodoPago.TRANSFERENCIA, color: '#F59E0B' },
].filter((d) => d.value > 0);

  return (
    <div>
      <div className="flex justify-end items-end gap-3 mb-4">
        <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Desde</label>
        <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
       </div>
       <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Hasta</label>
        <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
      </div>
    </div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <CardIcono titulo="Total de ventas" valor={`$${totalPeriodo.toFixed(2)}`} colorFondo="bg-green-100" colorBorde="border-green-100" colorIcono="text-green-600" icono="total" />
    <CardIcono titulo="Efectivo" valor={`$${porMetodoPago.EFECTIVO.toFixed(2)}`} colorFondo="bg-blue-100" colorBorde="border-blue-100" colorIcono="text-blue-600" icono="efectivo" />
    <CardIcono titulo="Tarjeta" valor={`$${porMetodoPago.TARJETA.toFixed(2)}`} colorFondo="bg-purple-100" colorBorde="border-purple-100" colorIcono="text-purple-600" icono="tarjeta" />
    <CardIcono titulo="Transferencia" valor={`$${porMetodoPago.TRANSFERENCIA.toFixed(2)}`} colorFondo="bg-amber-100" colorBorde="border-amber-100" colorIcono="text-amber-600" icono="transferencia" />  
</div>
    
       

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">Ventas por día</h3>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={datosGrafica}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Total']} />
        <Line type="monotone" dataKey="total" stroke="#1D4ED8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>

  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <h3 className="text-sm font-semibold text-slate-700 mb-4">Ventas por método de pago</h3>
    {datosDona.length === 0 ? (
      <p className="text-center text-slate-400 py-16 text-sm">Sin ventas en este periodo</p>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={datosDona} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {datosDona.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>
</div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Productos más vendidos</h3>
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
            {top.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin ventas en este periodo</td></tr>
            ) : (
              top.map((p) => (
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
    </div>
  );
}

const PALETA_PROVEEDORES = ['#247fe0', '#ab87ea', '#F59E0B', '#059669', '#DC2626', '#0891B2'];

function TabCompras({ compras }: { compras: Compra[] }) {
  const [inicio, setInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [fin, setFin] = useState(() => new Date().toISOString().slice(0, 10));

  const comprasFiltradas = filtrarPorRango(compras, inicio, fin + 'T23:59:59');
  const datosGrafica = agruparPorDia(comprasFiltradas);
  const top = topProductosComprados(comprasFiltradas);
  const totalPeriodo = comprasFiltradas.reduce((acc, c) => acc + (c.total ?? 0), 0);
  const numeroCompras = comprasFiltradas.length;
  const productoTop = top[0];

  const porProveedor = comprasPorProveedor(comprasFiltradas);
  const proveedorTop = porProveedor[0];

  const datosDona = porProveedor
    .slice(0, 5)
    .map((p, i) => ({ ...p, color: PALETA_PROVEEDORES[i % PALETA_PROVEEDORES.length] }));
  if (porProveedor.length > 5) {
    const restoTotal = porProveedor.slice(5).reduce((acc, p) => acc + p.value, 0);
    datosDona.push({ name: 'Otros', value: restoTotal, color: '#94A3B8' });
  }

  const totalCantidadComprada = top.reduce((acc, p) => acc + p.cantidad, 0);

  return (
    <div>
      <div className="flex justify-end items-end gap-3 mb-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Desde</label>
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hasta</label>
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CardIcono titulo="Total de compras" valor={`$${totalPeriodo.toFixed(2)}`} colorFondo="bg-red-100" colorBorde="border-red-100" colorIcono="text-red-600" icono="total" />
          <CardIcono titulo="Número de compras" valor={numeroCompras.toString()} colorFondo="bg-blue-100" colorBorde="border-blue-100" colorIcono="text-blue-600" icono="tarjeta" />
          <CardIcono
            titulo="Producto más comprado"
            valor={productoTop ? productoTop.nombre : '—'}
            colorFondo="bg-purple-100" colorBorde="border-purple-100" colorIcono="text-purple-600" icono="efectivo"
          />
          <CardIcono
            titulo="Proveedor principal"
            valor={proveedorTop ? proveedorTop.name : '—'}
            colorFondo="bg-amber-100" colorBorde="border-amber-100" colorIcono="text-amber-600" icono="transferencia"
          />
        </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Compras por día</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Total']} />
              <Line type="monotone" dataKey="total" stroke="#DC2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Compras por proveedor</h3>
          {datosDona.length === 0 ? (
            <p className="text-center text-slate-400 py-16 text-sm">Sin compras en este periodo</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={datosDona} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {datosDona.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Productos más comprados</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Total comprado</th>
              <th className="px-4 py-2 w-1/3">% del total comprado</th>
            </tr>
          </thead>
          <tbody>
            {top.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sin compras en este periodo</td></tr>
            ) : (
              top.map((p) => {
                const porcentaje = totalCantidadComprada > 0 ? (p.cantidad / totalCantidadComprada) * 100 : 0;
                return (
                  <tr key={p.nombre} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-800">{p.nombre}</td>
                    <td className="px-4 py-2 text-slate-600">{p.cantidad}</td>
                    <td className="px-4 py-2 text-slate-600">${p.total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#DC2626] rounded-full" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{porcentaje.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabUtilidades({ ventas }: { ventas: Venta[] }) {
  const [inicio, setInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [fin, setFin] = useState(() => new Date().toISOString().slice(0, 10));

  const ventasFiltradas = filtrarPorRango(ventas, inicio, fin + 'T23:59:59');
  const datosGrafica = calcularUtilidadPorDia(ventasFiltradas);
  const top = topProductosPorUtilidad(ventasFiltradas);

  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + (v.total ?? 0), 0);
  const totalUtilidad = datosGrafica.reduce((acc, d) => acc + d.utilidad, 0);
  const margen = totalVentas > 0 ? (totalUtilidad / totalVentas) * 100 : 0;
  const productoMasRentable = top[0];

  const totalUtilidadTop = top.reduce((acc, p) => acc + Math.max(p.utilidad, 0), 0);

  return (
    <div>
      <div className="flex justify-end items-end gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Desde</label>
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Hasta</label>
          <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <CardIcono titulo="Utilidad total" valor={`$${totalUtilidad.toFixed(2)}`} colorFondo="bg-green-100" colorBorde="border-green-100" colorIcono="text-green-600" icono="total" />
        <CardIcono titulo="Total vendido" valor={`$${totalVentas.toFixed(2)}`} colorFondo="bg-blue-100" colorBorde="border-blue-100" colorIcono="text-blue-600" icono="efectivo" />
        <CardIcono titulo="Margen de utilidad" valor={`${margen.toFixed(1)}%`} colorFondo="bg-purple-100" colorBorde="border-purple-100" colorIcono="text-purple-600" icono="tarjeta" />
        <CardIcono titulo="Producto más rentable" valor={productoMasRentable ? productoMasRentable.nombre : '—'} colorFondo="bg-amber-100" colorBorde="border-amber-100" colorIcono="text-amber-600" icono="transferencia"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Utilidad por día</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={datosGrafica}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Utilidad']} />
            <Line type="monotone" dataKey="utilidad" stroke="#059669" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Productos más rentables</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2">Producto</th>
              <th className="px-4 py-2">Utilidad generada</th>
              <th className="px-4 py-2 w-1/3">% de la utilidad total</th>
            </tr>
          </thead>
          <tbody>
            {top.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400">Sin ventas en este periodo</td></tr>
            ) : (
              top.map((p) => {
                const porcentaje = totalUtilidadTop > 0 ? (Math.max(p.utilidad, 0) / totalUtilidadTop) * 100 : 0;
                return (
                  <tr key={p.nombre} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-800">{p.nombre}</td>
                    <td className={`px-4 py-2 font-medium ${p.utilidad >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      ${p.utilidad.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#059669] rounded-full" style={{ width: `${porcentaje}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{porcentaje.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}