import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useAuth } from '../../context/AuthContext';
import { sesionApi } from '../../api/sesion';
import { expiracionDelToken } from '../../utils/jwt';
import { mensajeDeError } from '../../utils/errores';

const notyf = new Notyf();

const AVISO_ANTES_MS = 2 * 60 * 1000;     // el aviso aparece 2 min antes de vencer (solo si hay inactividad)
const RENOVAR_ANTES_MS = 10 * 60 * 1000;  // en los últimos 10 min se renueva en silencio si hubo actividad
const ACTIVO_RECIENTE_MS = 5 * 60 * 1000; // "hubo actividad" = algo tocado en los últimos 5 min
const REINTENTO_MS = 15 * 1000;           // si falla la red, reintenta cada 15 s
const EVENTOS = ['mousedown', 'keydown', 'touchstart', 'wheel'] as const;

const formato = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function AvisoSesion() {
  const { token, logout, actualizarToken } = useAuth();
  const navigate = useNavigate();

  const [restante, setRestante] = useState<number | null>(null);
  const [renovando, setRenovando] = useState(false);
  const [noRenovable, setNoRenovable] = useState(false);

  const ultimaActividad = useRef(Date.now());
  const enVuelo = useRef(false);
  const proximoIntento = useRef(0);
  const noRenovableRef = useRef(false);

  // Registra que la persona está usando el sistema
  useEffect(() => {
    const marcar = () => {
      ultimaActividad.current = Date.now();
    };
    EVENTOS.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    return () => EVENTOS.forEach((e) => window.removeEventListener(e, marcar));
  }, []);

  const renovar = async (manual: boolean) => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    if (manual) setRenovando(true);
    try {
      const res = await sesionApi.renovar();
      actualizarToken(res.data.token);
      if (manual) notyf.success({ message: 'Sesión renovada.', duration: 2500 });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        // El servidor ya no renueva esta sesión (duración máxima o usuario sin acceso)
        noRenovableRef.current = true;
        setNoRenovable(true);
      } else {
        proximoIntento.current = Date.now() + REINTENTO_MS;
        if (manual) {
          notyf.error({ message: mensajeDeError(err, 'No se pudo renovar la sesión.'), duration: 4000 });
        }
      }
    } finally {
      enVuelo.current = false;
      if (manual) setRenovando(false);
    }
  };

  useEffect(() => {
    const exp = expiracionDelToken(token);
    if (!exp) {
      setRestante(null);
      return;
    }

    const revisar = () => {
      const ahora = Date.now();
      const r = exp - ahora;

      if (r <= 0) {
        logout();
        notyf.error({ message: 'Tu sesión expiró. Inicia sesión de nuevo.', duration: 4000 });
        navigate('/login', { replace: true });
        return;
      }
      setRestante(r);

      const hayActividad = ahora - ultimaActividad.current <= ACTIVO_RECIENTE_MS;
      const enVentanaDeRenovacion = r <= RENOVAR_ANTES_MS && r > AVISO_ANTES_MS;

      if (enVentanaDeRenovacion && hayActividad && !noRenovableRef.current && ahora >= proximoIntento.current) {
        renovar(false);
      }
    };

    revisar();
    const id = setInterval(revisar, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (restante === null || restante > AVISO_ANTES_MS) return null;

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
        {noRenovable ? (
          <>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Tu sesión está por terminar</h3>
            <p className="text-sm text-slate-500 mb-4">
              Esta sesión ya no se puede renovar. Termina lo que estás haciendo y vuelve a iniciar sesión.
            </p>
            <p className="text-4xl font-bold text-[#1D4ED8] mb-5">{formato(restante)}</p>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={cerrarSesion}
                autoFocus
                className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0]"
              >
                Cerrar sesión
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">¿Sigues ahí?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Llevas un rato sin actividad. Tu sesión se cerrará automáticamente en
            </p>
            <p className="text-4xl font-bold text-[#1D4ED8] mb-5">{formato(restante)}</p>
            <p className="text-sm text-slate-500 mb-5">¿Quieres seguir trabajando?</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={cerrarSesion}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar sesión
              </button>
              <button
                type="button"
                onClick={() => renovar(true)}
                disabled={renovando}
                autoFocus
                className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60"
              >
                {renovando ? 'Renovando...' : 'Seguir trabajando'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}