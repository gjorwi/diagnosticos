'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  SEXO_ETIQUETAS,
  TIPO_ATENCION_ETIQUETAS,
  calcularGrupoEtario,
  calcularSemanaEpidemiologica,
} from '@diag/shared';
import { BuscadorCie10 } from '@/components/autocomplete-cie10';
import { Alerta, Campo } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { claseInput, fechaDeHoy } from '@/lib/utils';

const esquema = z.object({
  sexo: z.enum(['M', 'F'], { errorMap: () => ({ message: 'Selecciona el sexo' }) }),
  edad: z
    .string()
    .min(1, 'Ingresa la edad')
    .refine(
      (valor) => Number.isInteger(Number(valor)) && Number(valor) >= 0 && Number(valor) <= 130,
      'Edad inválida (0 a 130)'
    ),
  tipoAtencion: z.enum(['consulta', 'emergencia', 'hospitalizacion'], {
    errorMap: () => ({ message: 'Selecciona el tipo de atención' }),
  }),
  fechaAtencion: z.string().min(1, 'Selecciona la fecha de atención'),
});

export function FormularioRegistro({ inicial, onGuardar, textoBoton = 'Guardar registro' }) {
  const { tienePermiso } = useAuth();
  const [seleccion, setSeleccion] = useState(inicial?.cie10 || null);
  const [errorCodigo, setErrorCodigo] = useState('');

  const { data: estadoCatalogo } = useQuery({
    queryKey: ['cie10-estado'],
    queryFn: () => api.get('/cie10?limite=1'),
    staleTime: 60_000,
  });
  const catalogoVacio = estadoCatalogo?.total === 0;

  const valoresIniciales = inicial || {
    sexo: undefined,
    edad: '',
    tipoAtencion: 'consulta',
    fechaAtencion: fechaDeHoy(),
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciales,
  });

  useEffect(() => {
    reset(valoresIniciales);
    setSeleccion(inicial?.cie10 || null);
  }, [inicial]);

  const edad = useWatch({ control, name: 'edad' });
  const fechaAtencion = useWatch({ control, name: 'fechaAtencion' });

  const grupoCalculado =
    edad !== '' && Number.isInteger(Number(edad)) && Number(edad) >= 0
      ? calcularGrupoEtario(Number(edad))
      : null;
  const semanaCalculada = fechaAtencion ? calcularSemanaEpidemiologica(fechaAtencion) : null;

  const enviar = handleSubmit(async (datos) => {
    setErrorCodigo('');
    if (!seleccion) {
      setErrorCodigo('Selecciona un diagnóstico CIE-10');
      return;
    }
    await onGuardar({
      sexo: datos.sexo,
      edad: Number(datos.edad),
      codigo: seleccion.codigo,
      descripcion: seleccion.descripcion,
      tipoAtencion: datos.tipoAtencion,
      fechaAtencion: datos.fechaAtencion,
    });
  });

  return (
    <form onSubmit={enviar} className="space-y-5">
      {catalogoVacio && (
        <Alerta tipo="aviso">
          El catálogo CIE-10 está vacío.{' '}
          {tienePermiso('catalog.manage') ? (
            <>
              <Link href="/admin/catalogo" className="font-medium underline">
                Carga el catálogo
              </Link>{' '}
              (demo u oficial) antes de registrar diagnósticos.
            </>
          ) : (
            <>Solicita a un administrador que lo cargue en Admin → Catálogo CIE-10.</>
          )}
        </Alerta>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Campo etiqueta="Sexo" error={errors.sexo?.message}>
          <div className="flex gap-3">
            {['M', 'F'].map((valor) => (
              <label
                key={valor}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition has-checked:border-indigo-500 has-checked:bg-indigo-50 has-checked:text-indigo-700"
              >
                <input type="radio" value={valor} {...register('sexo')} className="accent-indigo-600" />
                {SEXO_ETIQUETAS[valor]}
              </label>
            ))}
          </div>
        </Campo>

        <Campo
          etiqueta="Edad (años cumplidos)"
          error={errors.edad?.message}
          ayuda={grupoCalculado ? `Grupo etario: ${grupoCalculado}` : 'Para menores de 1 año ingresar 0'}
        >
          <input
            type="number"
            min="0"
            max="130"
            step="1"
            placeholder="Ej: 45"
            className={claseInput(errors.edad)}
            {...register('edad')}
          />
        </Campo>
      </div>

      <Campo etiqueta="Diagnóstico CIE-10" error={errorCodigo}>
        <BuscadorCie10
          seleccionado={seleccion}
          onSeleccionar={(resultado) => {
            setSeleccion(resultado);
            if (resultado) setErrorCodigo('');
          }}
          error={errorCodigo}
          autoFocus={!inicial}
        />
      </Campo>

      <div className="grid gap-5 md:grid-cols-2">
        <Campo etiqueta="Tipo de atención" error={errors.tipoAtencion?.message}>
          <select className={claseInput(errors.tipoAtencion)} {...register('tipoAtencion')}>
            {Object.entries(TIPO_ATENCION_ETIQUETAS).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          etiqueta="Fecha de atención"
          error={errors.fechaAtencion?.message}
          ayuda={
            semanaCalculada
              ? `Semana epidemiológica ${semanaCalculada.semanaEpidemiologica} / ${semanaCalculada.anioEpidemiologico}`
              : 'Se calcula la semana epidemiológica (ISO) automáticamente'
          }
        >
          <input
            type="date"
            className={claseInput(errors.fechaAtencion)}
            {...register('fechaAtencion')}
          />
        </Campo>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {isSubmitting ? 'Guardando…' : textoBoton}
        </button>
      </div>
    </form>
  );
}
