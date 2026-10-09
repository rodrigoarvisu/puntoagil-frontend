import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import TabUsuarios from '../components/configuracion/TabUsuarios';

type Tab = 'usuarios' | 'roles' | 'negocio' | 'tickets' | 'metodosPago' | 'respaldos' | 'aspecto';

type Grupo = {
  titulo: string;
  items: { id: Tab; label: string }[];
};

const grupos: Grupo[] = [
  {
    titulo: 'General',
    items: [
      { id: 'negocio', label: 'Datos del negocio' },
      { id: 'aspecto', label: 'Aspecto' },
    ],
  },
  {
    titulo: 'Ventas',
    items: [
      { id: 'metodosPago', label: 'Métodos de pago' },
      { id: 'tickets', label: 'Tickets' },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { id: 'usuarios', label: 'Usuarios' },
      { id: 'roles', label: 'Roles y permisos' },
      { id: 'respaldos', label: 'Respaldos' },
    ],
  },
];

function Proximamente() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
      Próximamente...
    </div>
  );
}

export default function Configuracion() {
  const [tab, setTab] = useState<Tab>('usuarios');

  const contenido: Record<Tab, React.ReactNode> = {
    usuarios: <TabUsuarios />,
    negocio: <Proximamente />,
    roles: <Proximamente />,
    tickets: <Proximamente />,
    metodosPago: <Proximamente />,
    respaldos: <Proximamente />,
    aspecto: <Proximamente />,
  };

  return (
    <MainLayout titulo="Configuración">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Menú lateral interno */}
        <aside className="md:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-slate-400 p-2 md:sticky md:top-4">
            {grupos.map((grupo) => (
              <div key={grupo.titulo} className="mb-2 last:mb-0">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {grupo.titulo}
                </p>
                {grupo.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition ${
                      tab === item.id
                        ? 'bg-blue-50 text-[#1D4ED8] border-l-2 border-[#1D4ED8]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* Contenido */}
        <section className="flex-1 min-w-0">{contenido[tab]}</section>
      </div>
    </MainLayout>
  );
}