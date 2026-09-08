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

export interface DetalleVenta {
  id?: number;
  producto: { id: number };
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
}

export interface Venta {
  id?: number;
  usuario: { id: number };
  fecha?: string;
  total?: number;
  detalles: DetalleVenta[];
  metodoPago: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA';
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