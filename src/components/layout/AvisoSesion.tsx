import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { registrarManejadorSesionInvalida } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { sesionApi } from '../../api/sesion';
import { expiracionDelToken } from '../../utils/jwt';
import { mensajeDeError } from '../../utils/errores';

const INACTIVIDAD_MS = 15 * 60 * 1000;    // sin actividad este tiempo → aparece la pregunta
const RENOVAR_ANTES_MS = 10 * 60 * 1000;  // con actividad, en los últimos 10 min del token se renueva en silencio
const ACTIVO_RECIENTE_MS = 5 * 60 * 1000; // "hubo actividad" = algo tocado en los últimos 5 min
const REINTENTO_MS = 15 * 1000;           // si falla la red, reintenta cada 15 s
const PEDIR_PASSWORD_AL_VOLVER = false;   // true = siempre pide contraseña, aunque el token siga vigente
const EVENTOS = ['mousedown', 'keydown', 'touchstart', 'wheel'] as const;

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';

export default function AvisoSesion() {
  const { token, usuario, logout, actualizarToken } = useAuth();
  const navigate = useNavigate();

  const [bloqueada, setBloqueada] = useState(false);
  const [expirada, setExpirada] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const ultimaActividad = useRef(Date.now());
  const bloqueadaRef = useRef(false);
  const enVuelo = useRef(false);
  const proximoIntento = useRef(0);
  const sinRenovacion = useRef(false);
  const primeraRevision = useRef(true);
  const dialogoRef = useRef<HTMLDivElement>(null);

  const bloquear = (porExpiracion: boolean) => {
    bloqueadaRef.current = true;
    setBloqueada(true);
    if (porExpiracion) setExpirada(true);
  };

  const desbloquear = () => {
    bloqueadaRef.current = false;
    sinRenovacion.current = false;
    ultimaActividad.current = Date.now();
    setBloqueada(false);
    setExpirada(false);
    setPassword('');
    setError('');
  };

  // Registra que la persona está usando el sistema
  useEffect(() => {
    const marcar = () => {
      ultimaActividad.current = Date.now();
    };
    EVENTOS.forEach((e) => window.addEventListener(e, marcar, { passive: true }));
    return () => EVENTOS.forEach((e) => window.removeEventListener(e, marcar));
  }, []);

  // Si el servidor responde 401 en cualquier pantalla, se bloquea y se pide continuar
  useEffect(() => {
    registrarManejadorSesionInvalida(() => bloquear(true));
    return () => registrarManejadorSesionInvalida(null);
  }, []);

  const renovarEnSilencio = async () => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    try {
      const res = await sesionApi.renovar();
      actualizarToken(res.data.token);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        sinRenovacion.current = true; // el servidor ya no la renueva: al vencer se pedirá la contraseña
      } else {
        proximoIntento.current = Date.now() + REINTENTO_MS;
      }
    } finally {
      enVuelo.current = false;
    }
  };

  useEffect(() => {
    const exp = expiracionDelToken(token);
    if (!exp) return;

    // Al abrir la aplicación con un token que ya venció (por ejemplo, al día siguiente), se va al login
    if (primeraRevision.current) {
      primeraRevision.current = false;
      if (exp <= Date.now()) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
    }
    setExpirada(false);

    const revisar = () => {
      const ahora = Date.now();
      const restante = exp - ahora;

      if (restante <= 0) {
        bloquear(true); // venció: no se cierra sola, se pide continuar con la contraseña
        return;
      }
      if (bloqueadaRef.current) return;

      const sinActividad = ahora - ultimaActividad.current;

      if (sinActividad >= INACTIVIDAD_MS) {
        bloquear(false);
        return;
      }

      // Hay actividad y el token está por vencer: se renueva sin molestar
      if (
        restante <= RENOVAR_ANTES_MS &&
        sinActividad <= ACTIVO_RECIENTE_MS &&
        !sinRenovacion.current &&
        ahora >= proximoIntento.current
      ) {
        renovarEnSilencio();
      }
    };

    revisar();
    const id = setInterval(revisar, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Al bloquear, el foco sale de lo que haya detrás (por ejemplo, el campo del lector de código de barras)
  useEffect(() => {
    if (bloqueada && !dialogoRef.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement | null)?.blur();
      dialogoRef.current?.focus();
    }
  }, [bloqueada]);

  if (!bloqueada) return null;

  const pedirPassword = expirada || PEDIR_PASSWORD_AL_VOLVER;

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const seguirTrabajando = async () => {
    setProcesando(true);
    setError('');
    try {
      const res = await sesionApi.renovar();
      actualizarToken(res.data.token);
      desbloquear();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setExpirada(true); // ya no se puede renovar: se pide la contraseña
      } else {
        setError(mensajeDeError(err, 'No se pudo renovar la sesión.'));
      }
    } finally {
      setProcesando(false);
    }
  };

  const continuarConPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario || !password) return;
    setProcesando(true);
    setError('');
    try {
      const res = await api.post<{ token: string }>('/auth/login', {
        email: usuario.email,
        password,
      });
      actualizarToken(res.data.token);
      desbloquear();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Contraseña incorrecta.');
      } else {
        setError(mensajeDeError(err, 'No se pudo validar la contraseña.'));
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
      <div
        ref={dialogoRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl p-6 w-full max-w-sm outline-none"
      >
        {pedirPassword ? (
          <form onSubmit={continuarConPassword} className="space-y-3">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {expirada ? 'Tu sesión expiró' : '¿Quieres seguir trabajando?'}
              </h3>
              <p className="text-sm text-slate-500">
                {expirada
                  ? 'Por seguridad, ingresa tu contraseña para continuar.'
                  : 'Llevas un rato sin usar el sistema. Ingresa tu contraseña para continuar.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <input
              type="text"
              name="username"
              autoComplete="username"
              defaultValue={usuario?.email}
              hidden
              readOnly
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña de {usuario?.email}
              </label>
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarSesion}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar sesión
              </button>
              <button
                type="submit"
                disabled={procesando || !password}
                className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60"
              >
                {procesando ? 'Validando...' : 'Continuar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">¿Quieres seguir trabajando?</h3>
            <p className="text-sm text-slate-500 mb-5">Llevas un rato sin usar el sistema.</p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
            )}

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
                onClick={seguirTrabajando}
                disabled={procesando}
                className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60"
              >
                {procesando ? 'Renovando...' : 'Seguir trabajando'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}