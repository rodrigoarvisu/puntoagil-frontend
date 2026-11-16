import api from './axios';

export const sesionApi = {
  renovar: () => api.post<{ token: string }>('/auth/renovar'),
};