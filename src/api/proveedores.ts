import api from './axios';
import type { Proveedor } from '../types';

export const proveedoresApi = {
  listarTodos: () => api.get<Proveedor[]>('/proveedores'),
  buscarPorId: (id: number) => api.get<Proveedor>(`/proveedores/${id}`),
  crear: (proveedor: Omit<Proveedor, 'id'>) => api.post<Proveedor>('/proveedores', proveedor),
  actualizar: (id: number, proveedor: Omit<Proveedor, 'id'>) =>
    api.put<Proveedor>(`/proveedores/${id}`, proveedor),
  eliminar: (id: number) => api.delete(`/proveedores/${id}`),
};