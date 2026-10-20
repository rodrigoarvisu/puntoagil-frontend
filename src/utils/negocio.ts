import type { CampoNegocio, Negocio, NegocioErrores } from '../types';

export const NEGOCIO_VACIO: Negocio = {
  nombre: '',
  razonSocial: '',
  rfc: '',
  telefono: '',
  email: '',
  sitioWeb: '',
  calle: '',
  colonia: '',
  codigoPostal: '',
  ciudad: '',
  estado: '',
};

export const CAMPOS_NEGOCIO = Object.keys(NEGOCIO_VACIO) as CampoNegocio[];

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CP_REGEX = /^\d{5}$/;

const soloDigitos = (valor: string) => valor.replace(/\D/g, '');

const esUrlValida = (valor: string) => {
  try {
    const url = new URL(/^https?:\/\//i.test(valor) ? valor : `https://${valor}`);
    return url.hostname.includes('.');
  } catch {
    return false;
  }
};

/** Convierte la respuesta del servidor en un objeto seguro: sin null ni campos faltantes. */
export const desdeServidor = (data: Partial<Record<CampoNegocio, string | null>>): Negocio => {
  const resultado = { ...NEGOCIO_VACIO };
  CAMPOS_NEGOCIO.forEach((campo) => {
    resultado[campo] = data?.[campo] ?? '';
  });
  return resultado;
};

/** Recorta espacios y normaliza el RFC antes de validar o enviar. */
export const limpiarNegocio = (negocio: Negocio): Negocio => {
  const resultado = { ...negocio };
  CAMPOS_NEGOCIO.forEach((campo) => {
    resultado[campo] = negocio[campo].trim();
  });
  resultado.rfc = resultado.rfc.toUpperCase();
  return resultado;
};

/** Devuelve los errores en el mismo orden en que aparecen los campos en el formulario. */
export const validarNegocio = (n: Negocio): NegocioErrores => {
  const errores: NegocioErrores = {};

  if (!n.nombre) errores.nombre = 'El nombre del negocio es obligatorio.';

  if (n.rfc && !RFC_REGEX.test(n.rfc)) {
    errores.rfc = 'RFC no válido. Ejemplo: XAXX010101000.';
  }

  if (n.telefono && soloDigitos(n.telefono).length !== 10) {
    errores.telefono = 'El teléfono debe tener 10 dígitos.';
  }

  if (n.email && !EMAIL_REGEX.test(n.email)) {
    errores.email = 'Escribe un correo válido.';
  }

  if (n.sitioWeb && !esUrlValida(n.sitioWeb)) {
    errores.sitioWeb = 'Escribe una dirección web válida.';
  }

  if (n.codigoPostal && !CP_REGEX.test(n.codigoPostal)) {
    errores.codigoPostal = 'El código postal debe tener 5 dígitos.';
  }

  return errores;
};