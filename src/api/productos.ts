import api from './axios';
import type { Producto } from '../types';

export const productosApi = {
  listarTodos: () => api.get<Producto[]>('/productos'),
  buscarPorId: (id: number) => api.get<Producto>(`/productos/${id}`),
  crear: (producto: Omit<Producto, 'id'>) => api.post<Producto>('/productos', producto),
  actualizar: (id: number, producto: Omit<Producto, 'id'>) =>
    api.put<Producto>(`/productos/${id}`, producto),
  eliminar: (id: number) => api.delete(`/productos/${id}`),
  agotados: () => api.get<Producto[]>('/productos/agotados'),
  porAgotarse: () => api.get<Producto[]>('/productos/por-agotarse'),
};