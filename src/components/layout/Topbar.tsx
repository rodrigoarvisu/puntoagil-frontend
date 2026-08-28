import { useAuth } from '../../context/AuthContext';

export default function Topbar({ titulo }: { titulo: string }) {
  const { usuario, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-slate-800">{titulo}</h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{usuario?.nombre}</p>
          <p className="text-xs text-slate-500">
            {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Cajero'}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}