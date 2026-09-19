import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import TabUsuarios from '../components/configuracion/TabUsuarios';

type Tab = 'usuarios' | 'negocio';

export default function Configuracion() {
  const [tab, setTab] = useState<Tab>('usuarios');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'usuarios', label: 'Usuarios' },
    { id: 'negocio', label: 'Datos del negocio' },
  ];

  return (
    <MainLayout titulo="Configuración">
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              tab === t.id ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'usuarios' && <TabUsuarios />}
      {tab === 'negocio' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          Próximamente...
        </div>
      )}
    </MainLayout>
  );
}