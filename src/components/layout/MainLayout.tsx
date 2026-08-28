import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar titulo={titulo} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}