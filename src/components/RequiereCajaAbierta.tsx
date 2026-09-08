import { useEffect, useState, type ReactNode } from 'react';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { aperturaCajaApi } from '../api/aperturaCaja';
import { useAuth } from '../context/AuthContext';

const notyf = new Notyf();

export default function RequiereCajaAbierta({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [hayCajaAbierta, setHayCajaAbierta] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [montoInicial, setMontoInicial] = useState(0);
  const [abriendo, setAbriendo] = useState(false);

  const verificar = async () => {
    setCargando(true);
    try {
      const res = await aperturaCajaApi.obtenerActiva();
      setHayCajaAbierta(res.status === 200 && !!res.data);
    } catch {
      setHayCajaAbierta(false);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    verificar();
  }, []);

  const handleAbrir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setAbriendo(true);
    try {
      await aperturaCajaApi.abrir(usuario.id, Number(montoInicial));
      notyf.success({ message: 'Caja abierta correctamente.', duration: 3000 });
      setHayCajaAbierta(true);
    } catch (err: any) {
      notyf.error({
        message: err?.response?.data?.mensaje || 'No se pudo abrir la caja.',
        duration: 4000,
      });
    } finally {
      setAbriendo(false);
    }
  };

  if (cargando) {
    return <p className="text-center text-slate-400 py-12">Verificando caja...</p>;
  }

  if (!hayCajaAbierta) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="bg-white rounded-xl border border-slate-200 p-8 w-full max-w-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Abrir caja</h3>
          <p className="text-sm text-slate-500 mb-4">
            No hay una caja abierta. Ingresa el efectivo inicial para comenzar a vender.
          </p>
          <form onSubmit={handleAbrir} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Efectivo inicial (fondo de caja)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={montoInicial}
                onChange={(e) => setMontoInicial(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={abriendo}
              className="w-full bg-[#1D4ED8] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a44c0] disabled:opacity-50 transition"
            >
              {abriendo ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}