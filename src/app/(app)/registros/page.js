'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SEXO_ETIQUETAS, TIPO_ATENCION_ETIQUETAS, formatearFecha } from '@diag/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Cargando, Insignia, Tarjeta } from '@/components/ui';
import { claseInput, mensajeDeError } from '@/lib/utils';

const tamanoPagina = 20;

export default function RegistrosPage() {
  const { usuario, tienePermiso } = useAuth();
  const { mostrar } = useToast();
  const cliente = useQueryClient();

  const [borrador, setBorrador] = useState({
    fechaDesde: '',
    fechaHasta: '',
    sexo: '',
    tipoAtencion: '',
    codigo: '',
  });
  const [filtros, setFiltros] = useState({ ...borrador });
  const [pagina, setPagina] = useState(1);

  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) parametros.set(clave, valor);
  });
  parametros.set('pagina', String(pagina));
  parametros.set('limite', String(tamanoPagina));

  const { data, isLoading, error } = useQuery({
    queryKey: ['registros', filtros, pagina],
    queryFn: () => api.get(`/records?${parametros.toString()}`),
  });

  const eliminar = useMutation({
    mutationFn: (id) => api.eliminar(`/records/${id}`),
    onSuccess: () => {
      mostrar('Registro eliminado', 'exito');
      cliente.invalidateQueries({ queryKey: ['registros'] });
    },
    onError: (err) => mostrar(mensajeDeError(err), 'error'),
  });

  const puedeEditar = (registro) =>
    usuario.rol === 'admin' ||
    usuario.rol === 'supervisor' ||
    String(registro.creadoPor?._id || '') === String(usuario.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registros epidemiológicos</h1>
          <p className="text-sm text-slate-500">Datos anónimos agregados para reportes estadísticos</p>
        </div>
        {tienePermiso('records.create') && (
          <Link
            href="/registros/nuevo"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            ＋ Nuevo registro
          </Link>
        )}
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
            <label className="mb-1 block text-xs font-medium text-slate-600">Desde</label>
            <input
              type="date"
              className={claseInput(false)}
              value={borrador.fechaDesde}
              onChange={(evento) => setBorrador({ ...borrador, fechaDesde: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
            <input
              type="date"
              className={claseInput(false)}
              value={borrador.fechaHasta}
              onChange={(evento) => setBorrador({ ...borrador, fechaHasta: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sexo</label>
            <select
              className={claseInput(false)}
              value={borrador.sexo}
              onChange={(evento) => setBorrador({ ...borrador, sexo: evento.target.value })}
            >
              <option value="">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Atención</label>
            <select
              className={claseInput(false)}
              value={borrador.tipoAtencion}
              onChange={(evento) => setBorrador({ ...borrador, tipoAtencion: evento.target.value })}
            >
              <option value="">Todas</option>
              {Object.entries(TIPO_ATENCION_ETIQUETAS).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">CIE-10</label>
            <div className="flex gap-2">
              <input
                className={claseInput(false)}
                placeholder="Ej: I10"
                value={borrador.codigo}
                onChange={(evento) => setBorrador({ ...borrador, codigo: evento.target.value })}
              />
              <Boton type="submit" tamano="sm">
                Buscar
              </Boton>
            </div>
          </div>
        </form>
      </Tarjeta>

      <Tarjeta
        titulo={`Resultados${data ? ` (${data.total})` : ''}`}
        acciones={
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => {
              const limpiar = { fechaDesde: '', fechaHasta: '', sexo: '', tipoAtencion: '', codigo: '' };
              setBorrador(limpiar);
              setFiltros(limpiar);
              setPagina(1);
            }}
          >
            Limpiar
          </Boton>
        }
      >
        {isLoading && <Cargando />}
        {error && <Alerta>{mensajeDeError(error)}</Alerta>}

        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Sexo</th>
                    <th className="py-2 pr-3">Edad</th>
                    <th className="py-2 pr-3">Grupo</th>
                    <th className="py-2 pr-3">CIE-10</th>
                    <th className="py-2 pr-3">Diagnóstico</th>
                    <th className="py-2 pr-3">Atención</th>
                    <th className="py-2 pr-3">Semana</th>
                    <th className="py-2 pr-3">Digitado por</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datos.map((registro) => (
                    <tr key={registro.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-3 whitespace-nowrap">{formatearFecha(registro.fechaAtencion)}</td>
                      <td className="py-2 pr-3">{SEXO_ETIQUETAS[registro.sexo]}</td>
                      <td className="py-2 pr-3">{registro.edad}</td>
                      <td className="py-2 pr-3">
                        <Insignia>{registro.grupoEtario}</Insignia>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs font-semibold text-indigo-700">
                        {registro.cie10.codigo}
                      </td>
                      <td className="max-w-64 truncate py-2 pr-3" title={registro.cie10.descripcion}>
                        {registro.cie10.descripcion}
                      </td>
                      <td className="py-2 pr-3">{TIPO_ATENCION_ETIQUETAS[registro.tipoAtencion]}</td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        S{registro.semanaEpidemiologica}/{registro.anioEpidemiologico}
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {registro.creadoPor?.nombre || '—'}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          {puedeEditar(registro) && (
                            <Link
                              href={`/registros/${registro.id}`}
                              className="text-xs font-medium text-indigo-600 hover:underline"
                            >
                              Editar
                            </Link>
                          )}
                          {tienePermiso('records.delete') && (
                            <button
                              type="button"
                              className="text-xs font-medium text-red-600 hover:underline"
                              onClick={() => {
                                if (window.confirm('¿Eliminar este registro? Esta acción quedará auditada.')) {
                                  eliminar.mutate(registro.id);
                                }
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data.datos.length && (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-sm text-slate-500">
                        No hay registros con los filtros seleccionados.
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
                  onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
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
