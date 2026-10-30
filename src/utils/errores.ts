import axios from 'axios';

export function mensajeDeError(error: unknown, porDefecto = 'Ocurrió un error, intenta de nuevo'): string {
  if (!axios.isAxiosError(error)) return porDefecto;
  if (!error.response) return 'No se pudo conectar con el servidor';

  const { status, data } = error.response;
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo';
  if (status === 403) return 'No tienes permiso para esta acción';
  if (status >= 500) return porDefecto;
  if (data?.campos) return Object.values(data.campos as Record<string, string>).join('. ');
  return data?.mensaje ?? porDefecto;
}