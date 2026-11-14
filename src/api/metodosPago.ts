import api from './axios';

export type TipoMetodoPago = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';

export interface MetodoPago {
  id: number;
  nombre: string;
  tipo: TipoMetodoPago;
  requiereReferencia: boolean;
  activo: boolean;
  orden: number;
}

export interface MetodoPagoForm {
  nombre: string;
  tipo: TipoMetodoPago;
  requiereReferencia: boolean;
}

export const metodosPagoApi = {
  listarActivos: () => api.get<MetodoPago[]>('/metodos-pago/activos'),
  listarTodos: () => api.get<MetodoPago[]>('/metodos-pago'),
  crear: (datos: MetodoPagoForm) => api.post<MetodoPago>('/metodos-pago', datos),
  actualizar: (id: number, datos: MetodoPagoForm) => api.put<MetodoPago>(`/metodos-pago/${id}`, datos),
  cambiarEstado: (id: number, activo: boolean) =>
    api.patch<MetodoPago>(`/metodos-pago/${id}/estado`, null, { params: { activo } }),
};