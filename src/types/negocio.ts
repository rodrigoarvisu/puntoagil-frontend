export interface Negocio {
  nombre: string;
  razonSocial: string;
  rfc: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  calle: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export type CampoNegocio = keyof Negocio;
export type NegocioErrores = Partial<Record<CampoNegocio, string>>;