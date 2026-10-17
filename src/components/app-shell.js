'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const NAVEGACION = [
  { href: '/', etiqueta: 'Panel', permiso: null, icono: '▦' },
  { href: '/registros/nuevo', etiqueta: 'Nuevo registro', permiso: 'records.create', icono: '＋' },
  { href: '/registros', etiqueta: 'Registros', permiso: 'records.read', icono: '≡' },
  { href: '/importar', etiqueta: 'Carga masiva', permiso: 'imports.run', icono: '⇪' },
  { href: '/reportes', etiqueta: 'Reportes', permiso: 'reports.view', icono: '▤' },
  { href: '/auditoria', etiqueta: 'Auditoría', permiso: 'audit.view', icono: '◉' },
  { href: '/admin/usuarios', etiqueta: 'Usuarios', permiso: 'users.manage', icono: '♟' },
  { href: '/admin/catalogo', etiqueta: 'Catálogo CIE-10', permiso: 'catalog.manage', icono: '☰' },
  {
    href: '/admin/configuracion',
    etiqueta: 'Configuración',
    permiso: 'settings.manage',
    icono: '⚙',
  },
];

export function TarjetaUsuario() {
  const { usuario, cerrarSesion } = useAuth();
  const router = useRouter();

  return (
    <div className="border-t border-slate-200 p-4">
      <p className="truncate text-sm font-medium text-slate-800">{usuario.nombre}</p>
      <p className="truncate text-xs text-slate-500">
        {usuario.email} · <span className="capitalize">{usuario.rol}</span>
      </p>
      <button
        type="button"
        onClick={async () => {
          await cerrarSesion();
          router.replace('/login');
        }}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export function AppShell({ children }) {
  const { tienePermiso } = useAuth();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = NAVEGACION.filter((enlace) => !enlace.permiso || tienePermiso(enlace.permiso));

  const contenido = (
    <>
      <nav className="flex-1 space-y-1 p-3">
        {enlaces.map((enlace) => {
          const activo =
            pathname === enlace.href || (enlace.href !== '/' && pathname.startsWith(enlace.href));
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                activo
                  ? 'bg-indigo-600 font-medium text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="w-4 text-center">{enlace.icono}</span>
              {enlace.etiqueta}
            </Link>
          );
        })}
      </nav>
      <TarjetaUsuario />
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-sm font-semibold tracking-tight text-indigo-700">
            Registros Epidemiológicos
          </p>
          <p className="text-xs text-slate-500">Digitalización y reportes EPI13 / EPI14</p>
        </div>
        {contenido}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <p className="text-sm font-semibold text-indigo-700">Registros Epidemiológicos</p>
          <button
            type="button"
            onClick={() => setMenuAbierto((actual) => !actual)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          >
            Menú
          </button>
        </header>

        {menuAbierto && (
          <div className="flex max-h-[70vh] shrink-0 flex-col overflow-y-auto border-b border-slate-200 bg-white lg:hidden">
            {contenido}
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
