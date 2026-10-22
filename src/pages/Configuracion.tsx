import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import MainLayout from '../components/layout/MainLayout';
import TabUsuarios from '../components/configuracion/TabUsuarios';
import TabDatos from '../components/configuracion/TabDatos';
import { useAuth } from '../context/AuthContext';
import TabAspecto from '@/components/configuracion/TabAspecto';

type Tab = 'usuarios' | 'roles' | 'negocio' | 'tickets' | 'metodosPago' | 'respaldos' | 'aspecto';

type Item = { id: Tab; label: string; soloAdmin?: boolean };

type Grupo = {
  titulo: string;
  items: Item[];
};

const grupos: Grupo[] = [
  {
    titulo: 'General',
    items: [
      { id: 'negocio', label: 'Datos del negocio', soloAdmin: true },
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
      { id: 'usuarios', label: 'Usuarios', soloAdmin: true },
      { id: 'roles', label: 'Roles y permisos', soloAdmin: true },
      { id: 'respaldos', label: 'Respaldos', soloAdmin: true },
    ],
  },
];

function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-6">{titulo}</h2>
      <div className="bg-white rounded-xl border border-[#0F1E3D] p-8 text-center text-slate-400">
        Próximamente...
      </div>
    </div>
  );
}

export default function Configuracion() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const [cambiosPendientes, setCambiosPendientes] = useState(false);

  const esAdmin = usuario?.rol === 'ADMIN';

  // Solo se muestran las opciones permitidas para el rol; los grupos vacíos se descartan
  const gruposVisibles = useMemo(
    () =>
      grupos
        .map((g) => ({ ...g, items: g.items.filter((i) => esAdmin || !i.soloAdmin) }))
        .filter((g) => g.items.length > 0),
    [esAdmin]
  );

  // La pestaña activa vive en la URL; si es inválida o no permitida, se usa la primera visible
  const idsVisibles = gruposVisibles.flatMap((g) => g.items.map((i) => i.id));
  const tabParam = params.get('tab') as Tab | null;
  const tab: Tab = tabParam && idsVisibles.includes(tabParam) ? tabParam : idsVisibles[0];

  const cambiarTab = async (nuevo: Tab) => {
    if (nuevo === tab) return;

    if (cambiosPendientes) {
      const resultado = await Swal.fire({
        title: '¿Salir sin guardar?',
        text: 'Tienes cambios sin guardar que se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Seguir editando',
        reverseButtons: true,
      });
      if (!resultado.isConfirmed) return;
    }

    setParams({ tab: nuevo }, { replace: true });
  };

  const contenido: Record<Tab, ReactNode> = {
    usuarios: <TabUsuarios />,
    negocio: <TabDatos onCambiosPendientes={setCambiosPendientes} />,
    roles: <Proximamente titulo="Roles y permisos" />,
    tickets: <Proximamente titulo="Tickets" />,
    metodosPago: <Proximamente titulo="Métodos de pago" />,
    respaldos: <Proximamente titulo="Respaldos" />,
    aspecto: <TabAspecto />,
  };

  return (
    <MainLayout titulo="Configuración">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Menú lateral interno */}
        <aside className="md:w-56 shrink-0">
          <nav
            aria-label="Secciones de configuración"
            className="bg-white rounded-xl border border-slate-400 p-2 md:sticky md:top-4"
          >
            {gruposVisibles.map((grupo) => (
              <div key={grupo.titulo} className="mb-2 last:mb-0">
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {grupo.titulo}
                </p>
                {grupo.items.map((item) => {
                  const activo = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => cambiarTab(item.id)}
                      aria-current={activo ? 'page' : undefined}
                      className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md border-l-2 transition ${
                        activo
                          ? 'bg-blue-50 text-[#1D4ED8] border-[#1D4ED8]'
                          : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
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