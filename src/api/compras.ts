import api from './axios';
import type { Compra } from '../types';

export const comprasApi = {
  listarTodas: () => api.get<Compra[]>('/compras'),
  buscarPorId: (id: number) => api.get<Compra>(`/compras/${id}`),
  registrar: (compra: Compra) => api.post<Compra>('/compras', compra),
};