import type { Venta, DetalleVenta } from '../types';

const redondear = (n: number) => Math.round(n * 100) / 100;

export function pagosPorTipo(ventas: Venta[]) {
  const t = { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0, OTRO: 0 };
  ventas.forEach((v) =>
    v.pagos.forEach((p) => {
      t[p.tipo] += p.monto;
    })
  );
  return {
    EFECTIVO: redondear(t.EFECTIVO),
    TARJETA: redondear(t.TARJETA),
    TRANSFERENCIA: redondear(t.TRANSFERENCIA),
    OTRO: redondear(t.OTRO),
  };
}

export function pagosPorMetodo(ventas: Venta[]) {
  const mapa = new Map<string, number>();
  ventas.forEach((v) =>
    v.pagos.forEach((p) => mapa.set(p.metodoPago, (mapa.get(p.metodoPago) ?? 0) + p.monto))
  );
  return Array.from(mapa, ([name, value]) => ({ name, value: redondear(value) })).sort(
    (a, b) => b.value - a.value
  );
}

// Si falta el costo, la línea cuenta con utilidad 0 (no se infla)
const utilidadLinea = (d: DetalleVenta) =>
  d.subtotal - (d.costoUnitario ?? d.precioUnitario) * d.cantidad;

export function utilidadPorDia(ventas: Venta[]) {
  const mapa = new Map<string, number>();
  ventas.forEach((v) => {
    const dia = v.fecha.slice(0, 10);
    const utilidad = v.detalles.reduce((acc, d) => acc + utilidadLinea(d), 0);
    mapa.set(dia, (mapa.get(dia) ?? 0) + utilidad);
  });
  return Array.from(mapa, ([fecha, utilidad]) => ({ fecha, utilidad: redondear(utilidad) })).sort(
    (a, b) => a.fecha.localeCompare(b.fecha)
  );
}

export function topProductosPorUtilidad(ventas: Venta[]) {
  const mapa = new Map<number, { nombre: string; utilidad: number }>();
  ventas.forEach((v) =>
    v.detalles.forEach((d) => {
      const actual = mapa.get(d.producto.id) ?? { nombre: d.producto.nombre.trim(), utilidad: 0 };
      actual.utilidad += utilidadLinea(d);
      mapa.set(d.producto.id, actual);
    })
  );
  return Array.from(mapa.values())
    .map((p) => ({ nombre: p.nombre, utilidad: redondear(p.utilidad) }))
    .sort((a, b) => b.utilidad - a.utilidad);
}