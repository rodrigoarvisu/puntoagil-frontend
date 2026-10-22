import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productosApi } from '../../api/productos';
import type { Producto } from '../../types';
import { Store } from 'lucide-react';
import { useNegocio } from '../../context/NegocioContext';

/* ───────── Notificaciones ───────── */

type Notificacion = {
  id: string; // incluye el stock para que un cambio de stock genere una alerta nueva
  tipo: 'agotado' | 'bajo';
  titulo: string;
  detalle: string;
};

const CLAVE_LEIDAS = 'puntoagil:notificaciones-leidas';
const INTERVALO_MS = 60_000; // revisa el inventario cada minuto

const leerLeidas = (): string[] => {
  try {
    const raw = localStorage.getItem(CLAVE_LEIDAS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const guardarLeidas = (ids: string[]) => {
  try {
    localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(ids));
  } catch {
    /* sin almacenamiento disponible: no pasa nada */
  }
};

const construirNotificaciones = (productos: Producto[]): Notificacion[] => {
  const agotados: Notificacion[] = [];
  const bajos: Notificacion[] = [];

  productos.forEach((p) => {
    if (p.stock === 0) {
      agotados.push({
        id: `agotado-${p.id}`,
        tipo: 'agotado',
        titulo: `${p.nombre} está agotado`,
        detalle: 'Sin existencias',
      });
    } else if (p.stock <= p.stockMinimo) {
      bajos.push({
        id: `bajo-${p.id}-${p.stock}`,
        tipo: 'bajo',
        titulo: `Stock bajo: ${p.nombre}`,
        detalle: `Quedan ${p.stock} (mínimo ${p.stockMinimo})`,
      });
    }
  });

  return [...agotados, ...bajos]; // lo más urgente primero
};

export default function Topbar({ titulo }: { titulo: string }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notifAbierto, setNotifAbierto] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [leidas, setLeidas] = useState<string[]>(leerLeidas);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const esAdmin = usuario?.rol === 'ADMIN';

  const { negocio } = useNegocio();
  const nombreNegocio = negocio.nombre.trim();

  // Iniciales para el avatar
  const iniciales =
    usuario?.nombre
      ?.split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || '?';

  /* ───────── Carga y actualización del inventario ───────── */

  const cargarProductos = useCallback(async () => {
    try {
      const res = await productosApi.listarTodos();
      setProductos(res.data);
    } catch {
      /* si falla, se conserva lo último que se tenía */
    }
  }, []);

  useEffect(() => {
    if (!usuario) return;
    cargarProductos();
    const intervalo = setInterval(cargarProductos, INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [usuario, cargarProductos]);

  const notificaciones = useMemo(() => construirNotificaciones(productos), [productos]);
  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id)).length;

  const marcarTodasLeidas = () => {
    // Se guardan solo las actuales para que la lista no crezca sin límite
    const ids = notificaciones.map((n) => n.id);
    setLeidas(ids);
    guardarLeidas(ids);
  };

  const abrirNotificaciones = () => {
    setMenuAbierto(false);
    setNotifAbierto((v) => !v);
    cargarProductos(); // datos frescos al abrir
  };

  const irAProductos = () => {
    setNotifAbierto(false);
    navigate('/productos');
  };

  /* ───────── Cerrar menús al hacer click fuera ───────── */

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      const destino = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(destino)) setMenuAbierto(false);
      if (notifRef.current && !notifRef.current.contains(destino)) setNotifAbierto(false);
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
    <header className="h-16 bg-white/80 backdrop-blur-sm border border-slate-400 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-semibold text-slate-800 leading-tight">{titulo}</h1>
        <p className="text-xs text-slate-400 capitalize hidden sm:block">{fechaHoy}</p>
      </div>

      <div className="flex items-center gap-3">
        {nombreNegocio && (
       <div title={nombreNegocio} 
       className="hidden md:flex items-center gap-2 max-w-[220px] px-3 py-1.5 rounded-lg bg-[#E6EDFD] text-[#0F1E3D]">
      <Store size={16} className="shrink-0 text-[#1D4ED8]" />
       <span className="text-sm font-medium truncate">{nombreNegocio}</span>
     </div>
      )}
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={abrirNotificaciones}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
            aria-label={
              noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'
            }
            aria-expanded={notifAbierto}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>

            {noLeidas > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>

          {notifAbierto && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg shadow-slate-200/80 border border-slate-400 animate-dropdown overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-300">
                <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
                <button
                  onClick={marcarTodasLeidas}
                  disabled={noLeidas === 0}
                  className="text-xs text-[#1D4ED8] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  Marcar como leídas
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-slate-700">Todo en orden</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No hay alertas de inventario.
                    </p>
                  </div>
                ) : (
                  notificaciones.map((n) => {
                    const sinLeer = !leidas.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={irAProductos}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition ${
                          sinLeer ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            n.tipo === 'agotado' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        />
                        <span className="min-w-0">
                          <span
                            className={`block text-sm text-slate-800 truncate ${
                              sinLeer ? 'font-semibold' : 'font-medium'
                            }`}
                          >
                            {n.titulo}
                          </span>
                          <span className="block text-xs text-slate-500">{n.detalle}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {notificaciones.length > 0 && (
                <button
                  onClick={irAProductos}
                  className="w-full px-4 py-2.5 text-sm font-medium text-[#1D4ED8] hover:bg-slate-50 border-t border-slate-300 transition"
                >
                  Ver inventario
                </button>
              )}
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="w-px h-8 bg-slate-200 border border-[#0F1E3D]" />

        {/* Menú de usuario */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setNotifAbierto(false);
              setMenuAbierto((v) => !v);
            }}
            className="flex items-center gap-3 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-200 transition"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1D4ED8] to-[#0F1E3D] flex items-center justify-center text-white text-sm font-semibold shadow-sm shadow-blue-900/20 flex-shrink-0">
              {iniciales}
            </div>

            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {usuario?.nombre}
              </p>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md mt-0.5 ${
                  esAdmin ? 'bg-blue-50 text-[#1D4ED8]' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    esAdmin ? 'bg-[#1D4ED8]' : 'bg-emerald-500'
                  }`}
                />
                {esAdmin ? 'Administrador' : 'Cajero'}
              </span>
            </div>

            <svg
              className={`w-4 h-4 text-slate-400 hover:text-slate-800 transition-transform ${
                menuAbierto ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {menuAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg shadow-slate-200/80 border border-slate-400 py-2 animate-dropdown">
              <div className="px-4 py-2.5 border-b border-slate-400">
                <p className="text-sm font-medium text-slate-800">{usuario?.nombre}</p>
                <p className="text-xs text-slate-400">{usuario?.email}</p>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l-3-3m0 0l3-3m-3 3H15"
                  />
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