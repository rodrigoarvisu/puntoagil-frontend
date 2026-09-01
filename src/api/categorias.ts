import api from './axios';
import type { Categoria } from '../types';

export const categoriasApi = {
  listarTodos: () => api.get<Categoria[]>('/categorias'),
  buscarPorId: (id: number) => api.get<Categoria>(`/categorias/${id}`),
  crear: (categoria: Omit<Categoria, 'id'>) => api.post<Categoria>('/categorias', categoria),
  actualizar: (id: number, categoria: Omit<Categoria, 'id'>) =>
    api.put<Categoria>(`/categorias/${id}`, categoria),
  eliminar: (id: number) => api.delete(`/categorias/${id}`),
};