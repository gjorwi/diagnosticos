'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Alerta, Boton, Cargando, Insignia, Tarjeta } from '@/components/ui';
import { claseInput, formatearFechaHora, mensajeDeError } from '@/lib/utils';

const ENTIDADES = ['registro', 'usuario', 'sesion', 'cie10', 'importacion', 'configuracion', 'reporte'];

const COLORES_ACCION = {
  crear: 'emerald',
  actualizar: 'sky',
  eliminar: 'red',
  importar: 'indigo',
  exportar: 'amber',
  login: 'slate',
  logout: 'slate',
  login_fallido: 'red',
  desactivar: 'red',
};

export default function AuditoriaPage() {
  const [pagina, setPagina] = useState(1);
  const [borrador, setBorrador] = useState({ entidad: '', accion: '', usuario: '', desde: '', hasta: '' });
  const [filtros, setFiltros] = useState({ ...borrador });

  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) parametros.set(clave, valor);
  });
  parametros.set('pagina', String(pagina));
  parametros.set('limite', '30');

  const { data, isLoading, error } = useQuery({
    queryKey: ['auditoria', filtros, pagina],
    queryFn: () => api.get(`/audit?${parametros.toString()}`),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Auditoría del sistema</h1>
        <p className="text-sm text-slate-500">Trazabilidad de cargas, ediciones, accesos y exportaciones</p>
      </div>

      <Tarjeta titulo="Filtros">
        <form
          className="grid gap-3 md:grid-cols-5"
          onSubmit={(evento) => {
            evento.preventDefault();
            setPagina(1);
            setFiltros({ ...borrador });
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Entidad</label>
            <select
              className={claseInput(false)}
              value={borrador.entidad}
              onChange={(evento) => setBorrador({ ...borrador, entidad: evento.target.value })}
            >
              <option value="">Todas</option>
              {ENTIDADES.map((entidad) => (
                <option key={entidad} value={entidad}>
                  {entidad}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Acción</label>
            <input
              className={claseInput(false)}
              placeholder="crear, actualizar…"
              value={borrador.accion}
              onChange={(evento) => setBorrador({ ...borrador, accion: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Usuario (correo)</label>
            <input
              className={claseInput(false)}
              value={borrador.usuario}
              onChange={(evento) => setBorrador({ ...borrador, usuario: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              className={claseInput(false)}
              value={borrador.desde}
              onChange={(evento) => setBorrador({ ...borrador, desde: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
            <div className="flex gap-2">
              <input
                type="date"
                className={claseInput(false)}
                value={borrador.hasta}
                onChange={(evento) => setBorrador({ ...borrador, hasta: evento.target.value })}
              />
              <Boton type="submit" tamano="sm">
                Filtrar
              </Boton>
            </div>
          </div>
        </form>
      </Tarjeta>

      <Tarjeta titulo={`Eventos${data ? ` (${data.total})` : ''}`}>
        {isLoading && <Cargando />}
        {error && <Alerta>{mensajeDeError(error)}</Alerta>}

        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Acción</th>
                    <th className="py-2 pr-3">Entidad</th>
                    <th className="py-2 pr-3">ID</th>
                    <th className="py-2">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datos.map((evento) => (
                    <tr key={evento._id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 text-xs whitespace-nowrap text-slate-500">
                        {formatearFechaHora(evento.createdAt)}
                      </td>
                      <td className="py-2 pr-3 text-xs">
                        {evento.usuario?.nombre || evento.usuarioEmail || '—'}
                      </td>
                      <td className="py-2 pr-3">
                        <Insignia color={COLORES_ACCION[evento.accion] || 'slate'}>{evento.accion}</Insignia>
                      </td>
                      <td className="py-2 pr-3">{evento.entidad}</td>
                      <td className="max-w-40 truncate py-2 pr-3 font-mono text-xs text-slate-500">
                        {evento.entidadId || '—'}
                      </td>
                      <td className="py-2 font-mono text-xs text-slate-500">{evento.ip || '—'}</td>
                    </tr>
                  ))}
                  {!data.datos.length && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        Sin eventos para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Página {data.pagina} de {data.paginas}
              </span>
              <div className="flex gap-2">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((actual) => actual - 1)}
                >
                  Anterior
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={pagina >= data.paginas}
                  onClick={() => setPagina((actual) => actual + 1)}
                >
                  Siguiente
                </Boton>
              </div>
            </div>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
