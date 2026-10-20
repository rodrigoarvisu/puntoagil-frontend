import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CampoFormularioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
  obligatorio?: boolean;
}

const base =
  'w-full h-10 border bg-[#E6EDFD] rounded-lg px-3 text-sm text-slate-800 ' +
  'focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed';
const normal = 'border-slate-200 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8]';
const conError = 'border-red-400 focus:ring-red-500/20 focus:border-red-500';

export default function CampoFormulario({
  etiqueta,
  error,
  ayuda,
  obligatorio = false,
  className,
  ...inputProps
}: CampoFormularioProps) {
  const id = useId();
  const idMensaje = `${id}-mensaje`;
  const mensaje = error ?? ayuda;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-slate-500 mb-1.5">
        {etiqueta}
        {obligatorio && <span className="text-red-500"> *</span>}
      </label>

      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={mensaje ? idMensaje : undefined}
        className={cn(base, error ? conError : normal)}
        {...inputProps}
      />

      {mensaje && (
        <p
          id={idMensaje}
          role={error ? 'alert' : undefined}
          className={cn('mt-1 text-xs', error ? 'text-red-600' : 'text-slate-400')}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}