import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useAuth } from '../../context/AuthContext';
import { sesionApi } from '../../api/sesion';
import { expiracionDelToken } from '../../utils/jwt';
import { mensajeDeError } from '../../utils/errores';

const notyf = new Notyf();
const AVISO_ANTES_MS = 2 * 60 * 1000; // el aviso aparece 2 minutos antes de vencer

const formato = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function AvisoSesion() {
  const { token, logout, actualizarToken } = useAuth();
  const navigate = useNavigate();
  const [restante, setRestante] = useState<number | null>(null);
  const [renovando, setRenovando] = useState(false);

  useEffect(() => {
    const exp = expiracionDelToken(token);
    if (!exp) {
      setRestante(null);
      return;
    }

    const revisar = () => {
      const r = exp - Date.now();
      if (r <= 0) {
        logout();
        notyf.error({ message: 'Tu sesión expiró. Inicia sesión de nuevo.', duration: 4000 });
        navigate('/login', { replace: true });
        return;
      }
      setRestante(r);
    };

    revisar();
    const id = setInterval(revisar, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (restante === null || restante > AVISO_ANTES_MS) return null;

  const seguirTrabajando = async () => {
    setRenovando(true);
    try {
      const res = await sesionApi.renovar();
      actualizarToken(res.data.token);
      notyf.success({ message: 'Sesión renovada.', duration: 2500 });
    } catch (err) {
      notyf.error({ message: mensajeDeError(err, 'No se pudo renovar la sesión.'), duration: 4000 });
    } finally {
      setRenovando(false);
    }
  };

  const cerrarSesion = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Tu sesión está por vencer</h3>
        <p className="text-sm text-slate-500 mb-4">
          Se cerrará automáticamente en
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
            onClick={seguirTrabajando}
            disabled={renovando}
            autoFocus
            className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60"
          >
            {renovando ? 'Renovando...' : 'Seguir trabajando'}
          </button>
        </div>
      </div>
    </div>
  );
}