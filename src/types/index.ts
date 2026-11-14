export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  codigoBarras?: string;
  categoria: Categoria;
  costo: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  telefono?: string;
  email?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'CAJERO';
}

export interface PagoVenta {
  id: number;
  metodoPagoId: number;
  metodoPago: string;
  tipo: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';
  monto: number;
  referencia: string | null;
}

export interface DetalleVenta {
  id: number;
  producto: { id: number; nombre: string };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  costoUnitario: number | null; // null para el cajero
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  usuario: { id: number; nombre: string };
  detalles: DetalleVenta[];
  pagos: PagoVenta[];
}

export interface DetalleCompra {
  id?: number;
  producto: { id: number };
  cantidad: number;
  costoUnitario: number;
  subtotal?: number;
}

export interface Compra {
  id?: number;
  proveedor: { id: number };
  usuario: { id: number };
  fecha?: string;
  total?: number;
  detalles: DetalleCompra[];
}

export interface CorteCaja {
  id?: number;
  usuario: { id: number };
  fecha?: string;
  totalVentas: number;
  totalUtilidad: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number;
}

export * from './negocio';