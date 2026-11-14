import api from './axios';
import type { Venta } from '../types';

export interface VentaRequest {
  detalles: { productoId: number; cantidad: number }[];
  pagos: { metodoPagoId: number; monto: number; referencia?: string }[];
  claveIdempotencia?: string;
}

export const ventasApi = {
  listarTodas: () => api.get<Venta[]>('/ventas'),
  buscarPorId: (id: number) => api.get<Venta>(`/ventas/${id}`),
  registrar: (venta: VentaRequest) => api.post<Venta>('/ventas', venta),
};