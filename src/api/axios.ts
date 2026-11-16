import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080/api`,
});

// El componente de sesión se registra aquí para decidir qué hacer ante un 401
let manejadorSesionInvalida: (() => void) | null = null;
export function registrarManejadorSesionInvalida(fn: (() => void) | null) {
  manejadorSesionInvalida = fn;
}

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
    // El login y la renovación manejan su propio 401
    const esAuth = url.includes('/auth/login') || url.includes('/auth/renovar');
    const hayToken = !!localStorage.getItem('token');

    if (status === 401 && !esAuth && hayToken) {
      if (manejadorSesionInvalida) {
        // Se bloquea la pantalla y se pide continuar, sin perder el trabajo en curso
        manejadorSesionInvalida();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;