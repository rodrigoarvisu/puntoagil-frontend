import api from './axios';
import type { CorteCaja } from '../types';

export interface GenerarCorteRequest {
  usuarioId: number;
  inicio: string;
  fin: string;
  efectivoContado: number;
}

export const corteCajaApi = {
  listarTodos: () => api.get<CorteCaja[]>('/cortes-caja'),
  buscarPorId: (id: number) => api.get<CorteCaja>(`/cortes-caja/${id}`),
  generar: (request: GenerarCorteRequest) => api.post<CorteCaja>('/cortes-caja', request),
};