import api from './axios';
import type { Venta } from '../types';

export const ventasApi = {
  listarTodas: () => api.get<Venta[]>('/ventas'),
  buscarPorId: (id: number) => api.get<Venta>(`/ventas/${id}`),
  registrar: (venta: Venta) => api.post<Venta>('/ventas', venta),
}