import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { negocioApi } from '../api/negocio';
import { NEGOCIO_VACIO, desdeServidor } from '../utils/negocio';
import { useAuth } from './AuthContext';
import type { Negocio } from '../types';

interface NegocioContextValue {
  negocio: Negocio;
  /** Actualiza el negocio en memoria (se usa después de guardar en Configuración). */
  actualizarNegocio: (negocio: Negocio) => void;
}

const NegocioContext = createContext<NegocioContextValue | undefined>(undefined);

export function NegocioProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const autenticado = Boolean(usuario);
  const [negocio, setNegocio] = useState<Negocio>(NEGOCIO_VACIO);

  // Carga los datos una vez por sesión; al cerrar sesión se limpian
  useEffect(() => {
    if (!autenticado) {
      setNegocio(NEGOCIO_VACIO);
      return;
    }

    const controlador = new AbortController();
    negocioApi
      .obtener(controlador.signal)
      .then(({ data }) => setNegocio(desdeServidor(data)))
      .catch(() => {
        /* si falla, el Topbar simplemente no muestra el nombre */
      });

    return () => controlador.abort();
  }, [autenticado]);

  const actualizarNegocio = useCallback((nuevo: Negocio) => setNegocio(nuevo), []);

  const value = useMemo(() => ({ negocio, actualizarNegocio }), [negocio, actualizarNegocio]);

  return <NegocioContext.Provider value={value}>{children}</NegocioContext.Provider>;
}

export function useNegocio(): NegocioContextValue {
  const contexto = useContext(NegocioContext);
  if (!contexto) {
    throw new Error('useNegocio debe usarse dentro de <NegocioProvider>');
  }
  return contexto;
}