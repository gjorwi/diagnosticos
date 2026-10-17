'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { SEXO_ETIQUETAS, TIPO_ATENCION_ETIQUETAS } from '@diag/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Cargando, Insignia, Tarjeta } from '@/components/ui';
import { mensajeDeError } from '@/lib/utils';
import { Alerta } from '@/components/ui';

const ACCESOS = [
  { href: '/registros/nuevo', etiqueta: 'Nuevo registro', permiso: 'records.create', descripcion: 'Digitación rápida desde formulario físico' },
  { href: '/registros', etiqueta: 'Registros', permiso: 'records.read', descripcion: 'Revisar y editar lo cargado' },
  { href: '/importar', etiqueta: 'Carga masiva', permiso: 'imports.run', descripcion: 'Importar planillas Excel o CSV' },
  { href: '/reportes', etiqueta: 'Reportes EPI13', permiso: 'reports.view', descripcion: 'Matriz por diagnóstico, sexo y grupo etario' },
];

export default function PanelPage() {
  const { usuario, tienePermiso } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['resumen'],
    queryFn: () => api.get('/reports/resumen'),
    enabled: tienePermiso('reports.view'),
  });

  const resumen = data?.resumen;
  const maximoSemana = resumen?.porSemana?.length
    ? Math.max(...resumen.porSemana.map((item) => item.total))
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hola, {usuario.nombre}</h1>
        <p className="text-sm text-slate-500">
          Panel del sistema de registros epidemiológicos anónimos · Rol <span className="capitalize">{usuario.rol}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.filter((acceso) => tienePermiso(acceso.permiso)).map((acceso) => (
          <Link
            key={acceso.href}
            href={acceso.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
          >
            <p className="font-semibold text-indigo-700">{acceso.etiqueta}</p>
            <p className="mt-1 text-xs text-slate-500">{acceso.descripcion}</p>
          </Link>
        ))}
      </div>

      {tienePermiso('reports.view') && (
        <>
          {isLoading && <Cargando texto="Cargando resumen…" />}
          {error && <Alerta>{mensajeDeError(error)}</Alerta>}

          {resumen && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Tarjeta>
                  <p className="text-3xl font-bold text-slate-900">{resumen.total}</p>
                  <p className="text-sm text-slate-500">Registros totales</p>
                </Tarjeta>
                {resumen.porSexo.map((item) => (
                  <Tarjeta key={item.sexo}>
                    <p className="text-3xl font-bold text-slate-900">{item.total}</p>
                    <p className="text-sm text-slate-500">{SEXO_ETIQUETAS[item.sexo] || item.sexo}</p>
                  </Tarjeta>
                ))}
                <Tarjeta>
                  <p className="text-3xl font-bold text-slate-900">
                    {resumen.porSemana.at(-1)?.semanaEpidemiologica ?? '—'}
                  </p>
                  <p className="text-sm text-slate-500">Última semana con registros</p>
                </Tarjeta>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Tarjeta titulo="Registros por tipo de atención">
                  <ul className="space-y-2">
                    {resumen.porTipoAtencion.map((item) => (
                      <li key={item.tipo} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">
                          {TIPO_ATENCION_ETIQUETAS[item.tipo] || item.tipo}
                        </span>
                        <Insignia color="indigo">{item.total}</Insignia>
                      </li>
                    ))}
                  </ul>
                </Tarjeta>

                <Tarjeta titulo="Últimas semanas epidemiológicas">
                  <ul className="space-y-2">
                    {resumen.porSemana.map((item) => (
                      <li key={`${item.anioEpidemiologico}-${item.semanaEpidemiologica}`}>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>
                            S{item.semanaEpidemiologica}/{item.anioEpidemiologico}
                          </span>
                          <span>{item.total}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-indigo-500"
                            style={{ width: `${maximoSemana ? (item.total / maximoSemana) * 100 : 0}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Tarjeta>
              </div>

              <Tarjeta titulo="Diagnósticos más frecuentes">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                      <th className="py-2 pr-3">Código</th>
                      <th className="py-2 pr-3">Diagnóstico</th>
                      <th className="py-2 text-right">Casos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.topDiagnosticos.map((item) => (
                      <tr key={item.codigo} className="border-b border-slate-100">
                        <td className="py-2 pr-3 font-mono text-xs font-semibold text-indigo-700">
                          {item.codigo}
                        </td>
                        <td className="py-2 pr-3">{item.descripcion}</td>
                        <td className="py-2 text-right font-semibold">{item.total}</td>
                      </tr>
                    ))}
                    {!resumen.topDiagnosticos.length && (
                      <tr>
                        <td colSpan="3" className="py-6 text-center text-slate-500">
                          Aún no hay datos cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Tarjeta>
            </>
          )}
        </>
      )}
    </div>
  );
}
