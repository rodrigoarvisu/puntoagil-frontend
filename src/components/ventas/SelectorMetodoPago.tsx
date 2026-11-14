import type { ReactElement } from 'react';
import type { MetodoPago, TipoMetodoPago } from '../../api/metodosPago';

const ICONOS: Record<TipoMetodoPago, ReactElement> = {
  EFECTIVO: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="2.5" strokeWidth={1.5} />
    </svg>
  ),
  TARJETA: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth={1.5} />
      <line x1="2" y1="10" x2="22" y2="10" strokeWidth={1.5} />
    </svg>
  ),
  TRANSFERENCIA: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  ),
  OTRO: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth={1.5} />
      <path strokeLinecap="round" strokeWidth={1.5} d="M3 10h18M16 14.5h2" />
    </svg>
  ),
};

interface Props {
  metodos: MetodoPago[];
  seleccionadoId: number | null;
  onChange: (metodo: MetodoPago) => void;
}

export default function SelectorMetodoPago({ metodos, seleccionadoId, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {metodos.map((m) => (
        <button
          key={m.id}
          type="button"
          title={m.nombre}
          onClick={() => onChange(m)}
          aria-pressed={m.id === seleccionadoId}
          className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition ${
            m.id === seleccionadoId
              ? 'border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          {ICONOS[m.tipo] ?? ICONOS.OTRO}
          <span className="text-xs font-medium max-w-full truncate">{m.nombre}</span>
        </button>
      ))}
    </div>
  );
}