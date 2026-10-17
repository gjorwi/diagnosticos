'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AppShell } from '@/components/app-shell';
import { Cargando } from '@/components/ui';

export default function AppLayout({ children }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login');
  }, [cargando, usuario, router]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Cargando texto="Verificando sesión…" />
      </div>
    );
  }

  if (!usuario) return null;

  return <AppShell>{children}</AppShell>;
}
