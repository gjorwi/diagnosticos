'use client';

import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TIPO_ATENCION_ETIQUETAS } from '@diag/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Cargando, Tarjeta } from '@/components/ui';
import { claseInput, fechaDeHoy, mensajeDeError } from '@/lib/utils';

function anioActual() {
  return new Date().getFullYear();
}

export default function ReportesPage() {
  const { tienePermiso } = useAuth();
  const { mostrar } = useToast();
  const [exportando, setExportando] = useState('');
  const [tipoReporte, setTipoReporte] = useState('epi13');
  const [fechaEpi14, setFechaEpi14] = useState(fechaDeHoy());

  const [borrador, setBorrador] = useState({
    anioEpidemiologico: String(anioActual()),
    semanaDesde: '1',
    semanaHasta: '53',
    tipoAtencion: '',
    codigos: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [filtros, setFiltros] = useState({ ...borrador });

  const parametros = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) parametros.set(clave, valor);
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['epi13', filtros],
    queryFn: () => api.get(`/reports/epi13?${parametros.toString()}`),
    enabled: tipoReporte === 'epi13',
  });

  const {
    data: dataEpi14,
    isLoading: cargandoEpi14,
    error: errorEpi14,
  } = useQuery({
    queryKey: ['epi14', fechaEpi14],
    queryFn: () => api.get(`/reports/epi14?fecha=${fechaEpi14}`),
    enabled: tipoReporte === 'epi14' && !!fechaEpi14,
  });

  const reporte = data?.reporte;
  const reporteEpi14 = dataEpi14?.reporte;

  const exportar = async (formato) => {
    setExportando(formato);
    try {
      const nombre = `epi13-${fechaDeHoy()}.${formato}`;
      await api.descargar(`/reports/export?${parametros.toString()}&formato=${formato}`, nombre);
      mostrar(`Exportación ${formato.toUpperCase()} generada`, 'exito');
    } catch (err) {
      mostrar(mensajeDeError(err), 'error');
    } finally {
      setExportando('');
    }
  };

  const exportarEpi14 = async () => {
    if (!fechaEpi14) {
      mostrar('Selecciona una fecha para el reporte EPI 14', 'error');
      return;
    }
    setExportando('epi14');
    try {
      await api.descargar(`/reports/epi14/export?fecha=${fechaEpi14}`, `epi14-${fechaEpi14}.xlsx`);
      mostrar('Exportación EPI 14 generada', 'exito');
    } catch (err) {
      mostrar(mensajeDeError(err), 'error');
    } finally {
      setExportando('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500">
            {tipoReporte === 'epi13'
              ? 'Casos por diagnóstico, sexo y grupo etario según semana epidemiológica (ISO)'
              : 'EPI 14 · Registro semanal de mortalidad por enfermedades de notificación obligatoria'}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-600">Reporte</label>
            <select
              className={claseInput(false)}
              value={tipoReporte}
              onChange={(evento) => setTipoReporte(evento.target.value)}
            >
              <option value="epi13">EPI 13</option>
              <option value="epi14">EPI 14</option>
            </select>
          </div>
          {tipoReporte === 'epi14' && (
            <div className="w-40">
              <label className="mb-1 block text-xs font-medium text-slate-600">Fecha</label>
              <input
                type="date"
                className={claseInput(false)}
                value={fechaEpi14}
                onChange={(evento) => setFechaEpi14(evento.target.value)}
              />
            </div>
          )}
          {tienePermiso('reports.export') && tipoReporte === 'epi13' && (
            <div className="flex gap-2">
              <Boton
                variante="exito"
                disabled={!reporte || !!exportando}
                onClick={() => exportar('xlsx')}
              >
                {exportando === 'xlsx' ? 'Generando…' : '⬇ Excel'}
              </Boton>
              <Boton
                variante="peligro"
                disabled={!reporte || !!exportando}
                onClick={() => exportar('pdf')}
              >
                {exportando === 'pdf' ? 'Generando…' : '⬇ PDF'}
              </Boton>
            </div>
          )}
          {tienePermiso('reports.export') && tipoReporte === 'epi14' && (
            <Boton variante="exito" disabled={!!exportando} onClick={exportarEpi14}>
              {exportando === 'epi14' ? 'Generando…' : '⬇ Excel EPI 14'}
            </Boton>
          )}
        </div>
      </div>

      {tipoReporte === 'epi14' && (
        <Alerta tipo="info">
          Vista previa del formato EPI 14 con los datos de la semana epidemiológica (ISO)
          correspondiente a la fecha seleccionada. La columna H corresponde a hombres y M a mujeres.
        </Alerta>
      )}

      {tipoReporte === 'epi14' && cargandoEpi14 && (
        <Cargando texto="Generando vista previa EPI 14…" />
      )}
      {tipoReporte === 'epi14' && errorEpi14 && <Alerta>{mensajeDeError(errorEpi14)}</Alerta>}

      {tipoReporte === 'epi14' && reporteEpi14 && (
        <Tarjeta
          titulo={`Vista previa EPI 14 · Semana ${reporteEpi14.semana} · Año ${reporteEpi14.anio}`}
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {reporteEpi14.filas.map((fila, indiceFila) => (
                  <tr key={indiceFila}>
                    {fila.map((celda, indiceColumna) =>
                      celda ? (
                        <td
                          key={`${indiceFila}-${indiceColumna}`}
                          colSpan={celda.colspan}
                          rowSpan={celda.rowspan}
                          className={`border border-slate-300 px-1 py-0.5 align-middle ${
                            celda.centrado ? 'text-center' : 'text-left'
                          } ${celda.negrita ? 'font-semibold text-slate-800' : 'text-slate-700'}`}
                          style={celda.fondo ? { backgroundColor: `#${celda.fondo}` } : undefined}
                        >
                          {celda.valor}
                        </td>
                      ) : null
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      )}

      {tipoReporte === 'epi13' && (
        <>
          <Tarjeta titulo="Filtros">
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              onSubmit={(evento) => {
                evento.preventDefault();
                setFiltros({ ...borrador });
              }}
            >
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Año epidemiológico
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  className={claseInput(false)}
                  value={borrador.anioEpidemiologico}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, anioEpidemiologico: evento.target.value })
                  }
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Semana desde
                </label>
                <input
                  type="number"
                  min="1"
                  max="53"
                  className={claseInput(false)}
                  value={borrador.semanaDesde}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, semanaDesde: evento.target.value })
                  }
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Semana hasta
                </label>
                <input
                  type="number"
                  min="1"
                  max="53"
                  className={claseInput(false)}
                  value={borrador.semanaHasta}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, semanaHasta: evento.target.value })
                  }
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Tipo de atención
                </label>
                <select
                  className={claseInput(false)}
                  value={borrador.tipoAtencion}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, tipoAtencion: evento.target.value })
                  }
                >
                  <option value="">Todas</option>
                  {Object.entries(TIPO_ATENCION_ETIQUETAS).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Códigos CIE-10 (separados por coma)
                </label>
                <input
                  className={claseInput(false)}
                  placeholder="I10,E11.9"
                  value={borrador.codigos}
                  onChange={(evento) => setBorrador({ ...borrador, codigos: evento.target.value })}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">Fecha desde</label>
                <input
                  type="date"
                  className={claseInput(false)}
                  value={borrador.fechaDesde}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, fechaDesde: evento.target.value })
                  }
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-slate-600">Fecha hasta</label>
                <input
                  type="date"
                  className={claseInput(false)}
                  value={borrador.fechaHasta}
                  onChange={(evento) =>
                    setBorrador({ ...borrador, fechaHasta: evento.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <Boton type="submit" tamano="sm">
                  Generar reporte
                </Boton>
              </div>
            </form>
          </Tarjeta>

          {isLoading && <Cargando texto="Generando reporte…" />}
          {error && <Alerta>{mensajeDeError(error)}</Alerta>}

          {reporte && (
            <Tarjeta
              titulo={`Matriz EPI13 · Total de casos: ${reporte.totales.total}`}
              acciones={
                <span className="text-xs text-slate-500">
                  M: {reporte.totales.totalM} · F: {reporte.totales.totalF}
                </span>
              }
            >
              <p className="mb-3 text-xs text-slate-500">{reporte.descripcionFiltros}</p>
              <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-200">
                <table className="tabla-matriz w-full border-collapse text-xs">
                  <thead className="sticky top-0 z-20 bg-slate-100">
                    <tr>
                      <th colSpan={2} className="bg-slate-100" />
                      {reporte.grupos.map((grupo) => (
                        <th key={grupo} colSpan={2} className="bg-slate-100 text-slate-700">
                          {grupo}
                        </th>
                      ))}
                      <th rowSpan={2} className="bg-amber-100 text-amber-900">
                        Total
                      </th>
                    </tr>
                    <tr>
                      <th className="bg-slate-100 text-left">Código</th>
                      <th className="bg-slate-100 text-left">Enfermedad (CIE-10)</th>
                      {reporte.grupos.map((grupo) => (
                        <Fragment key={grupo}>
                          <th className="bg-slate-50 text-slate-500">M</th>
                          <th className="bg-slate-50 text-slate-500">F</th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.filas.map((fila) => (
                      <tr key={fila.codigo} className={fila.enLista ? '' : 'bg-slate-50/70'}>
                        <td className="pegado-codigo font-mono text-indigo-700">{fila.codigo}</td>
                        <td className="pegado-enfermedad" title={fila.descripcion}>
                          {fila.descripcion}
                        </td>
                        {reporte.grupos.map((grupo) => (
                          <Fragment key={grupo}>
                            <td className="text-slate-600">{fila.celdas[`M|${grupo}`] || 0}</td>
                            <td className="text-slate-600">{fila.celdas[`F|${grupo}`] || 0}</td>
                          </Fragment>
                        ))}
                        <td className="bg-amber-50 font-semibold text-amber-900">{fila.total}</td>
                      </tr>
                    ))}
                    <tr className="bg-amber-100 font-semibold">
                      <td className="pegado-codigo bg-amber-100" />
                      <td className="pegado-enfermedad bg-amber-100">TOTAL</td>
                      {reporte.grupos.map((grupo) => (
                        <Fragment key={grupo}>
                          <td>{reporte.totales.celdas[`M|${grupo}`] || 0}</td>
                          <td>{reporte.totales.celdas[`F|${grupo}`] || 0}</td>
                        </Fragment>
                      ))}
                      <td>{reporte.totales.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Tarjeta>
          )}
        </>
      )}
    </div>
  );
}
