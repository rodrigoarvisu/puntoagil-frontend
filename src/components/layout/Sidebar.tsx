import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.puntoagil.png';

interface NavItem {
  label: string;
  path: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
  soloAdmin?: boolean;
}

const secciones: NavSection[] = [
  { items: [{ label: 'Dashboard', path: '/dashboard' }] },
  {
    title: 'Ventas',
    items: [
      { label: 'Nueva Venta', path: '/ventas/nueva' },
      { label: 'Ventas', path: '/ventas' },
    ],
  },
  {
    title: 'Compras',
    items: [
      { label: 'Nueva Compra', path: '/compras/nueva' },
      { label: 'Compras', path: '/compras' },
      { label: 'Proveedores', path: '/proveedores' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', path: '/productos' },
      { label: 'Categorías', path: '/categorias' },
    ],
  },
  { items: [{ label: 'Corte de Caja', path: '/corte-caja' }] },
  {
    title: 'Reportes',
    soloAdmin: true,
    items: [
      { label: 'Ventas', path: '/reportes/ventas' },
      { label: 'Compras', path: '/reportes/compras' },
      { label: 'Utilidades', path: '/reportes/utilidades' },
    ],
  },
  {
    title: 'Configuración',
    soloAdmin: true,
    items: [{ label: 'Configuración', path: '/configuracion' }],
  },
];

export default function Sidebar() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'ADMIN';

  const seccionesVisibles = secciones.filter((s) => !s.soloAdmin || esAdmin);

  return (
    <aside className="w-64 bg-[#0F1E3D] text-white flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="p-5 border-b border-white/10">
        <img src={logo} alt="PuntoÁgil" className="h-18 mx-auto brightness-0 invert" />
      </div>

      <nav className="flex-1 py-4">
        {seccionesVisibles.map((seccion, i) => (
          <div key={i} className="mb-4">
            {seccion.title && (
              <p className="px-5 text-xs font-semibold text-blue-300/50 uppercase tracking-wider mb-1">
                {seccion.title}
              </p>
            )}
            {seccion.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white font-medium'
                      : 'text-blue-100/80 hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}