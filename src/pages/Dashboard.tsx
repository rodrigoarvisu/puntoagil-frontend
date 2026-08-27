import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { usuario, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Bienvenido, {usuario?.nombre}</h1>
      <p className="text-slate-500">Rol: {usuario?.rol}</p>
      <button onClick={logout} className="mt-4 text-red-600 underline">
        Cerrar sesión
      </button>
    </div>
  );
}