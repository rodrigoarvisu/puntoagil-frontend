import api from './axios';

export interface AperturaCajaData {
  id: number;
  usuario: { id: number; nombre?: string };
  fecha: string;
  montoInicial: number;
  cerrada: boolean;
}

export const aperturaCajaApi = {
  obtenerActiva: () => api.get<AperturaCajaData>('/apertura-caja/activa'),
  abrir: (usuarioId: number, montoInicial: number) =>
    api.post<AperturaCajaData>('/apertura-caja', { usuarioId, montoInicial }),
};