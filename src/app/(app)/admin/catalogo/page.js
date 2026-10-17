'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Cargando, Insignia, Tarjeta } from '@/components/ui';
import { ArbolCie10 } from '@/components/arbol-cie10';
import { claseInput, mensajeDeError } from '@/lib/utils';

const FORMULARIO_VACIO = { codigoOriginal: null, codigo: '', descripcion: '', capitulo: '' };

function Pestanas({ vista, cambiar }) {
  const opciones = [
    { id: 'arbol', etiqueta: 'Árbol por capítulos' },
    { id: 'tabla', etiqueta: 'Tabla' },
  ];
  return (
    <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          onClick={() => cambiar(opcion.id)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            vista === opcion.id
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}

export default function CatalogoPage() {
  const { mostrar } = useToast();
  const cliente = useQueryClient();
  const inputArchivo = useRef(null);

  const [vista, setVista] = useState('arbol');
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [reemplazar, setReemplazar] = useState(false);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errorFormulario, setErrorFormulario] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['cie10', pagina, busqueda],
    queryFn: () => api.get(`/cie10?pagina=${pagina}&limite=20&q=${encodeURIComponent(busqueda)}`),
  });

  const invalidarCatalogo = () => {
    cliente.invalidateQueries({ queryKey: ['cie10'] });
    cliente.invalidateQueries({ queryKey: ['cie10-arbol'] });
  };

  const guardar = useMutation({
    mutationFn: () => {
      const datos = {
        codigo: formulario.codigo,
        descripcion: formulario.descripcion,
        capitulo: formulario.capitulo || undefined,
      };
      if (formulario.codigoOriginal) {
        return api.patch(`/cie10/${encodeURIComponent(formulario.codigoOriginal)}`, datos);
      }
      return api.post('/cie10', datos);
    },
    onSuccess: () => {
      mostrar(formulario.codigoOriginal ? 'Código actualizado' : 'Código creado', 'exito');
      setFormulario(FORMULARIO_VACIO);
      setErrorFormulario('');
      invalidarCatalogo();
    },
    onError: (err) => setErrorFormulario(mensajeDeError(err)),
  });

  const eliminar = useMutation({
    mutationFn: (codigo) => api.eliminar(`/cie10/${encodeURIComponent(codigo)}`),
    onSuccess: () => {
      mostrar('Código eliminado', 'exito');
      invalidarCatalogo();
    },
    onError: (err) => mostrar(mensajeDeError(err), 'error'),
  });

  const importar = useMutation({
    mutationFn: (archivo) => {
      const datos = new FormData();
      datos.append('archivo', archivo);
      if (reemplazar) datos.append('reemplazar', 'true');
      return api.subir('/cie10/import', datos);
    },
    onSuccess: (respuesta) => {
      mostrar(
        `Importación: ${respuesta.resultado.importadas} códigos de ${respuesta.resultado.procesadas} filas`,
        'exito'
      );
      invalidarCatalogo();
    },
    onError: (err) => mostrar(mensajeDeError(err), 'error'),
  });

  const enviar = (evento) => {
    evento.preventDefault();
    setErrorFormulario('');
    if (!formulario.codigo.trim() || !formulario.descripcion.trim()) {
      setErrorFormulario('Código y descripción son obligatorios');
      return;
    }
    guardar.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catálogo CIE-10</h1>
          <p className="text-sm text-slate-500">
            Códigos disponibles para el autocompletado y la validación
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <input
            ref={inputArchivo}
            type="file"
            accept=".json,.xlsx,.csv"
            className="hidden"
            onChange={(evento) => {
              const archivo = evento.target.files?.[0];
              if (archivo) importar.mutate(archivo);
              evento.target.value = '';
            }}
          />
          <Boton
            variante="secundario"
            disabled={importar.isPending}
            onClick={() => inputArchivo.current?.click()}
          >
            {importar.isPending ? 'Importando…' : '⬆ Importar catálogo'}
          </Boton>
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={reemplazar}
              onChange={(evento) => setReemplazar(evento.target.checked)}
            />
            Reemplazar catálogo (borra los códigos actuales)
          </label>
        </div>
      </div>

      <Pestanas vista={vista} cambiar={setVista} />

      {vista === 'arbol' ? (
        <Tarjeta
          titulo="Estructura por capítulos"
          acciones={<span className="text-xs text-slate-500">Pulsa un código para desplegar</span>}
        >
          <ArbolCie10 />
        </Tarjeta>
      ) : (
        <>
          <Tarjeta titulo={formulario.codigoOriginal ? `Editar ${formulario.codigoOriginal}` : 'Nuevo código'}>
            <form onSubmit={enviar} className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Código</label>
                <input
                  className={claseInput(false)}
                  placeholder="Ej: E11.9"
                  value={formulario.codigo}
                  onChange={(evento) => setFormulario({ ...formulario, codigo: evento.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
                <input
                  className={claseInput(false)}
                  placeholder="Ej: Diabetes mellitus tipo 2 sin complicaciones"
                  value={formulario.descripcion}
                  onChange={(evento) => setFormulario({ ...formulario, descripcion: evento.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Boton type="submit" disabled={guardar.isPending}>
                  {guardar.isPending ? 'Guardando…' : formulario.codigoOriginal ? 'Guardar' : 'Agregar'}
                </Boton>
                {formulario.codigoOriginal && (
                  <Boton variante="secundario" onClick={() => setFormulario(FORMULARIO_VACIO)}>
                    Cancelar
                  </Boton>
                )}
              </div>
            </form>
            {errorFormulario && <Alerta className="mt-3">{errorFormulario}</Alerta>}
            <p className="mt-3 text-xs text-slate-500">
              Para el catálogo oficial, sube el JSON jerárquico (<span className="font-mono">codes.json</span>)
              o un archivo con columnas <span className="font-mono">CODIGO</span> y{' '}
              <span className="font-mono">DESCRIPCION</span>. También puedes usar{' '}
              <span className="font-mono">npm run seed:cie10:oficial</span> (en la API).
            </p>
          </Tarjeta>

          <Tarjeta
            titulo="Códigos"
            acciones={
              <input
                className={claseInput(false)}
                placeholder="Buscar código o descripción"
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setPagina(1);
                }}
              />
            }
          >
            {isLoading && <Cargando />}
            {error && <Alerta>{mensajeDeError(error)}</Alerta>}

            {data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                        <th className="py-2 pr-3">Código</th>
                        <th className="py-2 pr-3">Descripción</th>
                        <th className="py-2 pr-3">Estado</th>
                        <th className="py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.datos.map((item) => (
                        <tr key={item.codigo} className="border-b border-slate-100">
                          <td className="py-2 pr-3 font-mono text-xs font-semibold text-indigo-700">
                            {item.codigo}
                          </td>
                          <td className="py-2 pr-3">{item.descripcion}</td>
                          <td className="py-2 pr-3">
                            <Insignia color={item.activo ? 'emerald' : 'red'}>
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </Insignia>
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="text-xs font-medium text-indigo-600 hover:underline"
                                onClick={() =>
                                  setFormulario({
                                    codigoOriginal: item.codigo,
                                    codigo: item.codigo,
                                    descripcion: item.descripcion,
                                    capitulo: item.capitulo || '',
                                  })
                                }
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium text-red-600 hover:underline"
                                onClick={() => {
                                  if (window.confirm(`¿Eliminar el código ${item.codigo}?`)) {
                                    eliminar.mutate(item.codigo);
                                  }
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!data.datos.length && (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-slate-500">
                            Sin resultados. Importa el catálogo oficial o agrega códigos manualmente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Página {data.pagina} de {data.paginas} · {data.total} códigos
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
        </>
      )}
    </div>
  );
}
