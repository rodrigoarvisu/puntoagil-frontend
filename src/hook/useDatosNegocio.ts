import { useCallback, useEffect, useMemo, useState } from 'react';
import { isCancel } from 'axios';
import { negocioApi } from '../api/negocio';
import { notyf } from '../lib/notyf';
import {
  CAMPOS_NEGOCIO,
  NEGOCIO_VACIO,
  desdeServidor,
  limpiarNegocio,
  validarNegocio,
} from '../utils/negocio';
import type { CampoNegocio, Negocio, NegocioErrores } from '../types';
import { useNegocio } from '../context/NegocioContext';

type ResultadoGuardado = { ok: true } | { ok: false; campoConError?: CampoNegocio };

export function useDatosNegocio() {
  const [datos, setDatos] = useState<Negocio>(NEGOCIO_VACIO);
  const [original, setOriginal] = useState<Negocio>(NEGOCIO_VACIO);
  const [errores, setErrores] = useState<NegocioErrores>({});
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { actualizarNegocio } = useNegocio();

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const { data } = await negocioApi.obtener(signal);
      const negocio = desdeServidor(data);
      setDatos(negocio);
      setOriginal(negocio);
    } catch (err) {
      if (isCancel(err)) return;
      setErrorCarga(true);
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    cargar(controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  const hayCambios = useMemo(
    () => CAMPOS_NEGOCIO.some((campo) => datos[campo] !== original[campo]),
    [datos, original]
  );

  const actualizarCampo = useCallback((campo: CampoNegocio, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    // Al corregir un campo se limpia solo su error
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  }, []);

  const descartar = useCallback(() => {
    setDatos(original);
    setErrores({});
  }, [original]);

  const guardar = async (): Promise<ResultadoGuardado> => {
    const limpio = limpiarNegocio(datos);
    const nuevosErrores = validarNegocio(limpio);
    const campoConError = (Object.keys(nuevosErrores) as CampoNegocio[])[0];

    if (campoConError) {
      setDatos(limpio);
      setErrores(nuevosErrores);
      return { ok: false, campoConError };
    }

    setGuardando(true);
    try {
      const { data } = await negocioApi.guardar(limpio);
      const guardado = desdeServidor(data);
      setDatos(guardado);
      setOriginal(guardado);
      actualizarNegocio(guardado);
      setErrores({});
      notyf.success('Los datos del negocio se guardaron correctamente.');
      return { ok: true };
    } catch {
      notyf.error('No se pudieron guardar los datos. Intenta de nuevo.');
      return { ok: false };
    } finally {
      setGuardando(false);
    }
  };

  return {
    datos,
    errores,
    cargando,
    errorCarga,
    guardando,
    hayCambios,
    actualizarCampo,
    descartar,
    guardar,
    recargar: () => cargar(),
  };
}