'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Tarjeta } from '@/components/ui';
import { mensajeDeError } from '@/lib/utils';

export default function ImportarPage() {
  const { mostrar } = useToast();
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');

  const descargarPlantilla = async () => {
    try {
      await api.descargar('/imports/plantilla', 'plantilla-registros.xlsx');
    } catch (err) {
      mostrar(mensajeDeError(err), 'error');
    }
  };

  const subir = async (evento) => {
    evento.preventDefault();
    if (!archivo) {
      setError('Selecciona un archivo Excel (.xlsx) o CSV');
      return;
    }

    setEnviando(true);
    setError('');
    setResumen(null);

    const datos = new FormData();
    datos.append('archivo', archivo);

    try {
      const respuesta = await api.subir('/imports/registros', datos);
      setResumen(respuesta.resumen);
      mostrar(`Importación finalizada: ${respuesta.resumen.insertadas} registros insertados`, 'exito');
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Carga masiva de registros</h1>
        <p className="text-sm text-slate-500">
          Digitaliza planillas completas desde Excel o CSV. Cada fila es un registro anónimo.
        </p>
      </div>

      <Tarjeta titulo="1. Descarga la plantilla">
        <p className="mb-3 text-sm text-slate-600">
          La plantilla incluye las columnas <span className="font-mono text-xs">SEXO</span>,{' '}
          <span className="font-mono text-xs">EDAD</span>, <span className="font-mono text-xs">CODIGO</span>,{' '}
          <span className="font-mono text-xs">TIPO_ATENCION</span> y{' '}
          <span className="font-mono text-xs">FECHA_ATENCION</span> con listas de validación.
        </p>
        <Boton variante="secundario" onClick={descargarPlantilla}>
          ⬇ Descargar plantilla Excel
        </Boton>
      </Tarjeta>

      <Tarjeta titulo="2. Sube tu archivo">
        <form onSubmit={subir} className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(evento) => setArchivo(evento.target.files?.[0] || null)}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
          />

          {error && <Alerta>{error}</Alerta>}

          <Boton type="submit" disabled={enviando || !archivo}>
            {enviando ? 'Procesando…' : 'Importar registros'}
          </Boton>
        </form>
      </Tarjeta>

      {resumen && (
        <Tarjeta titulo="Resultado de la importación">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{resumen.procesadas}</p>
              <p className="text-xs text-slate-500">Filas procesadas</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{resumen.insertadas}</p>
              <p className="text-xs text-emerald-600">Insertadas</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{resumen.erroresTotales}</p>
              <p className="text-xs text-amber-600">Con errores</p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3 text-center">
              <p className="text-2xl font-bold text-sky-700">{resumen.validas}</p>
              <p className="text-xs text-sky-600">Válidas</p>
            </div>
          </div>

          {resumen.errores?.length > 0 && (
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.errores.map((item, indice) => (
                    <tr key={`${item.fila}-${indice}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{item.fila}</td>
                      <td className="px-3 py-2 text-red-700">{item.mensaje}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {resumen.erroresTotales > resumen.errores.length && (
            <p className="mt-2 text-xs text-slate-500">
              Se muestran los primeros {resumen.errores.length} errores de {resumen.erroresTotales}.
            </p>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
