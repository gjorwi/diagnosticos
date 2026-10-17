'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Boton, Campo } from '@/components/ui';
import { claseInput, mensajeDeError } from '@/lib/utils';

export default function LoginPage() {
  const { iniciarSesion, usuario, cargando } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && usuario) router.replace('/');
  }, [cargando, usuario, router]);

  const enviar = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await iniciarSesion(email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">Sistema de</p>
          <h1 className="text-2xl font-bold text-slate-900">Registros Epidemiológicos</h1>
          <p className="mt-1 text-sm text-slate-500">Digitalización de datos y reportes EPI13</p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          <Campo etiqueta="Correo electrónico">
            <input
              type="email"
              required
              autoFocus
              autoComplete="username"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className={claseInput(false)}
              placeholder="usuario@institucion.cl"
            />
          </Campo>

          <Campo etiqueta="Contraseña">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              className={claseInput(false)}
              placeholder="••••••••"
            />
          </Campo>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </Boton>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Los registros son anónimos y agregados. No se almacenan datos personales.
        </p>
      </div>
    </div>
  );
}
