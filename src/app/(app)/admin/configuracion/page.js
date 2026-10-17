'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Cargando, Tarjeta } from '@/components/ui';
import { claseInput, mensajeDeError } from '@/lib/utils';

export default function ConfiguracionPage() {
  const { mostrar } = useToast();
  const cliente = useQueryClient();

  const [titulo, setTitulo] = useState('');
  const [gruposTexto, setGruposTexto] = useState('');
  const [enfermedadesTexto, setEnfermedadesTexto] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings-epi13'],
    queryFn: () => api.get('/settings/epi13'),
  });

  useEffect(() => {
    if (!data?.settings) return;
    setTitulo(data.settings.titulo || '');
    setGruposTexto((data.settings.gruposEtarios || []).join('\n'));
    setEnfermedadesTexto(
      (data.settings.enfermedadesNotificables || [])
        .map((enfermedad) => `${enfermedad.codigo}|${enfermedad.descripcion}`)
        .join('\n')
    );
  }, [data]);

  const guardar = useMutation({
    mutationFn: () => {
      const gruposEtarios = gruposTexto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean);

      const enfermedadesNotificables = enfermedadesTexto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean)
        .map((linea) => {
          const [codigo, ...resto] = linea.split('|');
          return { codigo: (codigo || '').trim(), descripcion: resto.join('|').trim() };
        });

      return api.put('/settings/epi13', {
        titulo: titulo.trim() || undefined,
        gruposEtarios,
        enfermedadesNotificables,
      });
    },
    onSuccess: () => {
      mostrar('Configuración EPI13 guardada', 'exito');
      setErrorFormulario('');
      cliente.invalidateQueries({ queryKey: ['settings-epi13'] });
    },
    onError: (err) => setErrorFormulario(mensajeDeError(err)),
  });

  const enviar = (evento) => {
    evento.preventDefault();
    setErrorFormulario('');

    const gruposEtarios = gruposTexto
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean);
    if (!gruposEtarios.length) {
      setErrorFormulario('Debes definir al menos un grupo etario');
      return;
    }

    const invalidas = enfermedadesTexto
      .split('\n')
      .map((linea) => linea.trim())
      .filter(Boolean)
      .filter((linea) => !linea.includes('|') || !linea.split('|')[0].trim() || !linea.split('|').slice(1).join('|').trim());
    if (invalidas.length) {
      setErrorFormulario('Cada enfermedad debe tener formato CODIGO|Descripción');
      return;
    }

    guardar.mutate();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuración EPI13</h1>
        <p className="text-sm text-slate-500">
          Define los grupos etarios (columnas) y las enfermedades de notificación obligatoria (filas) del reporte.
          Si dejas la lista de enfermedades vacía, el reporte mostrará todos los diagnósticos con casos.
        </p>
      </div>

      {isLoading && <Cargando />}
      {error && <Alerta>{mensajeDeError(error)}</Alerta>}

      {data && (
        <form onSubmit={enviar} className="space-y-4">
          <Tarjeta titulo="Título del reporte">
            <input
              className={claseInput(false)}
              value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)}
              placeholder="EPI13 - Enfermedades de notificación obligatoria"
            />
          </Tarjeta>

          <Tarjeta titulo="Grupos etarios (uno por línea)">
            <textarea
              className={`${claseInput(false)} min-h-48 font-mono text-sm`}
              value={gruposTexto}
              onChange={(evento) => setGruposTexto(evento.target.value)}
              spellCheck={false}
            />
            <p className="mt-2 text-xs text-slate-500">
              Formatos aceptados: <span className="font-mono">&lt;1</span>, <span className="font-mono">1-4</span>,{' '}
              <span className="font-mono">65+</span>. Se ordenan automáticamente.
            </p>
          </Tarjeta>

          <Tarjeta titulo="Enfermedades de notificación obligatoria (una por línea, formato CODIGO|Descripción)">
            <textarea
              className={`${claseInput(false)} min-h-48 font-mono text-sm`}
              value={enfermedadesTexto}
              onChange={(evento) => setEnfermedadesTexto(evento.target.value)}
              spellCheck={false}
              placeholder={'I10|Hipertensión esencial\nE11.9|Diabetes mellitus tipo 2 sin complicaciones'}
            />
          </Tarjeta>

          {errorFormulario && <Alerta>{errorFormulario}</Alerta>}

          <div className="flex justify-end">
            <Boton type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar configuración'}
            </Boton>
          </div>
        </form>
      )}
    </div>
  );
}
