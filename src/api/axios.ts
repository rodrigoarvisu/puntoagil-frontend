import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    // El login y la renovación manejan su propio 401 (credenciales incorrectas / sesión no renovable)
    const esAuth = url.includes('/auth/login') || url.includes('/auth/renovar');
    const hayToken = !!localStorage.getItem('token');

    // Solo es "sesión vencida" si había sesión y la petición no es del login ni de la renovación
    if (status === 401 && !esAuth && hayToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;