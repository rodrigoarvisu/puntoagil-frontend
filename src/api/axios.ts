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

export default api;

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const esLogin = (error.config?.url ?? '').includes('/auth/login');
    const hayToken = !!localStorage.getItem('token');

    if (status === 401 && !esLogin && hayToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
)