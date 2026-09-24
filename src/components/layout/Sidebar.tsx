import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.puntoagil.png';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  ClipboardList,
  Truck,
  Package,
  Tags,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  soloAdmin?: boolean;
}

const secciones: NavSection[] = [
  { items: [{ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }], soloAdmin: true },
  {
    title: 'Ventas',
    items: [
      { label: 'Nueva Venta', path: '/ventas/nueva', icon: ShoppingCart },
      { label: 'Ventas', path: '/ventas', icon: Receipt },
    ],
  },
  {
    title: 'Compras',
    items: [
      { label: 'Nueva Compra', path: '/compras/nueva', icon: ShoppingBag },
      { label: 'Compras', path: '/compras', icon: ClipboardList },
      { label: 'Proveedores', path: '/proveedores', icon: Truck },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', path: '/productos', icon: Package },
      { label: 'Categorías', path: '/categorias', icon: Tags },
    ],
  },
  { items: [{ label: 'Corte de Caja', path: '/corte-caja', icon: Wallet }] },
  {
    title: 'Reportes',
    soloAdmin: true,
    items: [{ label: 'Reportes', path: '/reportes', icon: BarChart3 }],
  },
  {
    title: 'Configuración',
    soloAdmin: true,
    items: [{ label: 'Configuración', path: '/configuracion', icon: Settings }],
  },
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';
  const [colapsado, setColapsado] = useState(false);

  const seccionesVisibles = secciones.filter((s) => !s.soloAdmin || esAdmin);

  return (
    <aside
      className={`${
        colapsado ? 'w-20' : 'w-64'
      } bg-[#0F1E3D] text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
    >
     {/* Header: logo + botón */}
<div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
  <img
    src={logo}
    alt="PuntoÁgil"
    className={`${colapsado ? 'h-8' : 'h-12'} shrink-0 transition-all duration-300 brightness-0 invert`}
  />

  {!colapsado && (
    <button
      onClick={() => setColapsado(true)}
      className="shrink-0 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      aria-label="Colapsar menú"
    >
      <ChevronLeft size={16} />
    </button>
  )}
</div>

      {colapsado && (
        <button
          onClick={() => setColapsado(false)}
          className="mx-auto mt-3 w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Expandir menú"
        >
          <ChevronRight size={16} />
        </button>
      )}

      <nav className="sidebar-scroll flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {seccionesVisibles.map((seccion, i) => (
          <div key={i} className="mb-4">
            {seccion.title && !colapsado && (
              <p className="px-5 text-xs font-semibold text-blue-300/50 uppercase tracking-wider mb-1">
                {seccion.title}
              </p>
            )}
            {seccion.title && colapsado && (
              <div className="mx-4 mb-2 border-t border-white/10" />
            )}
            {seccion.items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.path} className="relative group px-3">
                  <NavLink
                    to={item.path}
                    end={item.path === '/compras' || item.path === '/ventas'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
                        colapsado ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-[#1D4ED8] text-white font-medium shadow-md shadow-blue-900/30'
                          : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} className="shrink-0" />
                    {!colapsado && <span className="truncate">{item.label}</span>}
                  </NavLink>

                  {colapsado && (
                    <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap rounded-md bg-[#0F1E3D] border border-white/10 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg">
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}