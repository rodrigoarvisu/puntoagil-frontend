import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ titulo }: { titulo: string }) {
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const esAdmin = usuario?.rol === 'ADMIN';

  // Iniciales para el avatar
  const iniciales = usuario?.nombre
    ?.split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 leading-tight">{titulo}</h1>
        <p className="text-xs text-slate-400 capitalize hidden sm:block">{fechaHoy}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          aria-label="Notificaciones"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Separador */}
        <div className="w-px h-8 bg-slate-200" />

        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex items-center gap-3 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-50 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#0F1E3D] flex items-center justify-center text-white text-sm font-semibold shadow-sm shadow-blue-900/20 flex-shrink-0">
              {iniciales}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{usuario?.nombre}</p>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${
                  esAdmin
                    ? 'bg-blue-50 text-[#1D4ED8]'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${esAdmin ? 'bg-[#1D4ED8]' : 'bg-emerald-500'}`} />
                {esAdmin ? 'Administrador' : 'Cajero'}
              </span>
            </div>

            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${menuAbierto ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-slate-200/80 border border-slate-100 py-2 animate-dropdown">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{usuario?.nombre}</p>
                <p className="text-xs text-slate-400">{usuario?.email}</p>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l-3-3m0 0l3-3m-3 3H15" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}