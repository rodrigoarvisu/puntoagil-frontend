import { useState, type FormEvent } from 'react';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { perfilApi } from '../../api/perfil';
import { mensajeDeError } from '../../utils/errores';

const notyf = new Notyf();

const inputClass =
  'border border-slate-200 bg-[#E6EDFD] rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';

export default function ModalCambiarPassword({ onClose }: { onClose: () => void }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (nueva.length < 10) return setError('La nueva contraseña debe tener al menos 10 caracteres.');
    if (nueva !== confirmar) return setError('La confirmación no coincide con la nueva contraseña.');
    if (nueva === actual) return setError('La nueva contraseña debe ser distinta de la actual.');

    setGuardando(true);
    try {
      await perfilApi.cambiarPassword(actual, nueva);
      notyf.success({ message: 'Contraseña actualizada correctamente.', duration: 3000 });
      onClose();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Cambiar contraseña</h3>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña actual</label>
            <input type="password" required autoFocus autoComplete="current-password"
              value={actual} onChange={(e) => setActual(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nueva contraseña</label>
            <input type="password" required minLength={10} maxLength={72} autoComplete="new-password"
              value={nueva} onChange={(e) => setNueva(e.target.value)} className={inputClass} />
            <p className="text-xs text-slate-400 mt-1">Mínimo 10 caracteres.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar nueva contraseña</label>
            <input type="password" required maxLength={72} autoComplete="new-password"
              value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className={inputClass} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" disabled={guardando}
              className="px-4 py-2 text-sm bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1a44c0] disabled:opacity-60">
              {guardando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}