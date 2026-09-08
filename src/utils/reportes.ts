import type { Venta, Compra, Producto } from '../types';

export function filtrarPorRango<T extends { fecha?: string }>(
  items: T[],
  inicio: string,
  fin: string
): T[] {
  return items.filter((i) => i.fecha && i.fecha >= inicio && i.fecha <= fin);
}

export function agruparPorDia(items: { fecha?: string; total?: number }[]) {
  const mapa = new Map<string, number>();
  items.forEach((i) => {
    if (!i.fecha) return;
    const dia = i.fecha.slice(0, 10);
    mapa.set(dia, (mapa.get(dia) ?? 0) + (i.total ?? 0));
  });
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, total]) => ({ fecha, total }));
}

export function topProductosVendidos(ventas: Venta[], top = 5) {
  const mapa = new Map<string, { nombre: string; cantidad: number; total: number }>();
  ventas.forEach((v) => {
    v.detalles.forEach((d) => {
      const nombre = (d.producto as any).nombre ?? `#${d.producto.id}`;
      const actual = mapa.get(nombre) ?? { nombre, cantidad: 0, total: 0 };
      actual.cantidad += d.cantidad;
      actual.total += d.subtotal ?? d.cantidad * d.precioUnitario;
      mapa.set(nombre, actual);
    });
  });
  return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, top);
}

export function topProductosComprados(compras: Compra[], top = 5) {
  const mapa = new Map<string, { nombre: string; cantidad: number; total: number }>();
  compras.forEach((c) => {
    c.detalles.forEach((d) => {
      const nombre = (d.producto as any).nombre ?? `#${d.producto.id}`;
      const actual = mapa.get(nombre) ?? { nombre, cantidad: 0, total: 0 };
      actual.cantidad += d.cantidad;
      actual.total += d.subtotal ?? d.cantidad * d.costoUnitario;
      mapa.set(nombre, actual);
    });
  });
  return Array.from(mapa.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, top);
}

export function calcularUtilidadPorDia(ventas: Venta[]) {
  const mapa = new Map<string, number>();
  ventas.forEach((v) => {
    if (!v.fecha) return;
    const dia = v.fecha.slice(0, 10);
    let utilidadVenta = 0;
    v.detalles.forEach((d) => {
      const costo = (d.producto as any).costo ?? 0;
      const subtotal = d.subtotal ?? d.cantidad * d.precioUnitario;
      utilidadVenta += subtotal - costo * d.cantidad;
    });
    mapa.set(dia, (mapa.get(dia) ?? 0) + utilidadVenta);
  });
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, utilidad]) => ({ fecha, utilidad }));
}

export function topProductosPorUtilidad(ventas: Venta[], top = 5) {
  const mapa = new Map<string, { nombre: string; utilidad: number }>();
  ventas.forEach((v) => {
    v.detalles.forEach((d) => {
      const nombre = (d.producto as any).nombre ?? `#${d.producto.id}`;
      const costo = (d.producto as any).costo ?? 0;
      const subtotal = d.subtotal ?? d.cantidad * d.precioUnitario;
      const utilidad = subtotal - costo * d.cantidad;
      const actual = mapa.get(nombre) ?? { nombre, utilidad: 0 };
      actual.utilidad += utilidad;
      mapa.set(nombre, actual);
    });
  });
  return Array.from(mapa.values()).sort((a, b) => b.utilidad - a.utilidad).slice(0, top);
}

export function valuarStock(productos: Producto[]) {
  const valorCosto = productos.reduce((acc, p) => acc + p.costo * p.stock, 0);
  const valorVenta = productos.reduce((acc, p) => acc + p.precioVenta * p.stock, 0);
  const unidadesTotales = productos.reduce((acc, p) => acc + p.stock, 0);
  return {
    valorCosto,
    valorVenta,
    utilidadPotencial: valorVenta - valorCosto,
    unidadesTotales,
  };
}

export function totalPorMetodoPago(ventas: Venta[]) {
  const resultado = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 };
  ventas.forEach((v) => {
    if(v.metodoPago) {
      resultado[v.metodoPago] += v.total ?? 0;
    }
  });
  return resultado;
}

export function comprasPorProveedor(compras: Compra[]) {
  const mapa = new Map<string, number>();
    compras.forEach((c) => {
      const nombre = (c.proveedor as any)?.nombre ?? `#${c.proveedor.id}`;
      mapa.set(nombre, (mapa.get(nombre) ?? 0) + (c.total ?? 0));
    });
    return Array.from(mapa.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));
}

export function esHoy(fecha?: string) {
  if (!fecha) return false;
  const hoy = new Date();
  const hoyLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return fecha.slice(0, 10) === hoyLocal;
}
