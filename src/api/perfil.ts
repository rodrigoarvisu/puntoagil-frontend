import api from './axios'; // ajusta al nombre real de tu cliente

export const perfilApi = {
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    api.patch('/perfil/password', { passwordActual, passwordNueva }),
};