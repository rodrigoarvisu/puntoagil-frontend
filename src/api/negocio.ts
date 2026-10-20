import api from './axios';
import type { Negocio } from '../types';

export const negocioApi = {
  // El signal permite cancelar la petición si el componente se desmonta
  obtener: (signal?: AbortSignal) => api.get<Negocio>('/negocio', { signal }),
  guardar: (negocio: Negocio) => api.put<Negocio>('/negocio', negocio),
};