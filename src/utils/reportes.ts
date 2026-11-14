import type { Venta, Compra, Producto } from '../types';

// Compara solo el día (YYYY-MM-DD): una venta del último día del rango siempre entra,
// sin importar la hora ni los microsegundos que mande el servidor
export function filtrarPorRango<T extends { fecha?: string }>(
  items: T[],
  inicio: string,
  fin: string
): T[] {
  const desde = inicio.slice(0, 10);
  const hasta = fin.slice(0, 10);
  return items.filter((i) => {
    if (!i.fecha) return false;
    const dia = i.fecha.slice(0, 10);
    return dia >= desde && dia <= hasta;
  });
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
  const mapa = new Map<number, { nombre: string; cantidad: number; total: number }>();
  ventas.forEach((v) => {
    v.detalles.forEach((d) => {
      const actual =
        mapa.get(d.producto.id) ?? { nombre: d.producto.nombre.trim(), cantidad: 0, total: 0 };
      actual.cantidad += d.cantidad;
      actual.total += d.subtotal;
      mapa.set(d.producto.id, actual);
    });
  });
  return Array.from(mapa.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, top);
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

// Utilidad de una venta con el costo que tenía el producto al venderse.
// Si falta el costo (por ejemplo, la respuesta del cajero), la línea cuenta con utilidad 0
// en lugar de mostrar todo el precio como ganancia.
export function utilidadDeVenta(v: Venta): number {
  return v.detalles.reduce(
    (acc, d) => acc + d.subtotal - (d.costoUnitario ?? d.precioUnitario) * d.cantidad,
    0
  );
}

export function serieUltimosNDias<T extends { fecha?: string }>(
  items: T[],
  dias: number,
  obtenerValor: (item: T) => number
): { fecha: string; valor: number }[] {
  const resultado: { fecha: string; valor: number }[] = [];

  const hoy = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);

    const fechaTexto = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

    const valor = items
      .filter((item) => item.fecha?.slice(0, 10) === fechaTexto)
      .reduce((total, item) => total + obtenerValor(item), 0);

    resultado.push({
      fecha: fechaTexto,
      valor,
    });
  }
  return resultado;
}