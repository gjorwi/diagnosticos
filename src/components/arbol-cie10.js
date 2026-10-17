'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Alerta, Cargando } from '@/components/ui';

const SANGRIA = 18;

function Nodo({ nodo, profundidad }) {
  const [abierto, setAbierto] = useState(false);
  const tieneHijos = nodo.hijos > 0;

  const { data, isLoading, error } = useQuery({
    queryKey: ['cie10-arbol', nodo.codigo],
    queryFn: () => api.get(`/cie10/arbol?padre=${encodeURIComponent(nodo.codigo)}`),
    enabled: abierto && tieneHijos,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <li>
      <button
        type="button"
        disabled={!tieneHijos}
        onClick={() => tieneHijos && setAbierto((valor) => !valor)}
        className={`flex w-full items-start gap-2 rounded px-2 py-1.5 text-left ${
          tieneHijos ? 'hover:bg-slate-50' : 'cursor-default'
        }`}
        style={{ paddingLeft: `${profundidad * SANGRIA + 8}px` }}
      >
        <span className="w-3 shrink-0 text-center text-slate-400">
          {tieneHijos ? (abierto ? '▾' : '▸') : '·'}
        </span>
        <span className="shrink-0 font-mono text-xs font-semibold text-indigo-700">
          {nodo.codigo}
        </span>
        <span className="text-sm text-slate-700">{nodo.descripcion}</span>
        {tieneHijos && (
          <span className="ml-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {nodo.hijos}
          </span>
        )}
      </button>

      {abierto && tieneHijos && (
        <>
          {isLoading && (
            <p
              className="py-1.5 text-xs text-slate-500"
              style={{ paddingLeft: `${(profundidad + 1) * SANGRIA + 8}px` }}
            >
              Cargando…
            </p>
          )}
          {error && (
            <p
              className="py-1.5 text-xs text-red-600"
              style={{ paddingLeft: `${(profundidad + 1) * SANGRIA + 8}px` }}
            >
              No se pudieron cargar los códigos.
            </p>
          )}
          {data && (
            <ul>
              {data.nodos.map((hijo) => (
                <Nodo key={hijo.codigo} nodo={hijo} profundidad={profundidad + 1} />
              ))}
              {!data.nodos.length && (
                <li
                  className="py-1.5 text-xs text-slate-400"
                  style={{ paddingLeft: `${(profundidad + 1) * SANGRIA + 8}px` }}
                >
                  Sin códigos.
                </li>
              )}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

export function ArbolCie10() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cie10-arbol'],
    queryFn: () => api.get('/cie10/arbol'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <Cargando texto="Cargando capítulos…" />;
  if (error) return <Alerta>No se pudo cargar el árbol del catálogo.</Alerta>;

  if (!data?.nodos?.length) {
    return (
      <Alerta tipo="aviso">
        El catálogo no tiene la estructura por capítulos. Importa <span className="font-mono">docs/codes.json</span>{' '}
        (catálogo oficial) para ver el árbol.
      </Alerta>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-lg border border-slate-100">
      <ul className="py-1">
        {data.nodos.map((nodo) => (
          <Nodo key={nodo.codigo} nodo={nodo} profundidad={0} />
        ))}
      </ul>
    </div>
  );
}
