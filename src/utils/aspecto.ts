export type Tema = 'claro' | 'oscuro' | 'sistema';
export type TamanoTexto = 'pequeno' | 'normal' | 'grande';
export type Densidad = 'comoda' | 'compacta';

export interface Aspecto {
  tema: Tema;
  tamanoTexto: TamanoTexto;
  densidad: Densidad;
  reducirAnimaciones: boolean;
}

export const ASPECTO_POR_DEFECTO: Aspecto = {
  tema: 'claro',
  tamanoTexto: 'normal',
  densidad: 'comoda',
  reducirAnimaciones: false,
};

const CLAVE = 'puntoagil:aspecto';
const TEMAS: Tema[] = ['claro', 'oscuro', 'sistema'];

// Porcentajes (no px) para respetar el tamaño de letra del navegador
const ESCALA: Record<TamanoTexto, string> = {
  pequeno: '87.5%',
  normal: '100%',
  grande: '112.5%',
};

/** Lee lo guardado; cada valor se valida para no confiar en el contenido de localStorage. */
export function leerAspecto(): Aspecto {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
    return {
      tema: TEMAS.includes(g.tema) ? g.tema : ASPECTO_POR_DEFECTO.tema,
      tamanoTexto: g.tamanoTexto in ESCALA ? g.tamanoTexto : ASPECTO_POR_DEFECTO.tamanoTexto,
      densidad: g.densidad === 'compacta' ? 'compacta' : 'comoda',
      reducirAnimaciones: g.reducirAnimaciones === true,
    };
  } catch {
    return ASPECTO_POR_DEFECTO;
  }
}

export function guardarAspecto(aspecto: Aspecto) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(aspecto));
  } catch {
    /* sin almacenamiento: el ajuste solo dura esta sesión */
  }
}

/** Aplica el aspecto al <html>: tamaño con font-size y el resto con data-attributes (ver index.css). */
export function aplicarAspecto(aspecto: Aspecto) {
  const raiz = document.documentElement;
  const sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const oscuro = aspecto.tema === 'oscuro' || (aspecto.tema === 'sistema' && sistemaOscuro);

  raiz.style.fontSize = ESCALA[aspecto.tamanoTexto];
  raiz.dataset.tema = oscuro ? 'oscuro' : 'claro';
  raiz.dataset.densidad = aspecto.densidad;
  raiz.dataset.animaciones = aspecto.reducirAnimaciones ? 'reducidas' : 'normales';
}

/** Se llama una vez en main.tsx: aplica lo guardado y sigue los cambios del sistema (tema "sistema"). */
export function iniciarAspecto() {
  aplicarAspecto(leerAspecto());
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => aplicarAspecto(leerAspecto()));
}