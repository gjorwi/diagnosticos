'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { FormularioRegistro } from '@/components/formulario-registro';
import { Alerta, Cargando, Tarjeta } from '@/components/ui';
import { formatearFecha, mensajeDeError } from '@/lib/utils';

export default function EditarRegistroPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const { mostrar } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['registro', id],
    queryFn: () => api.get(`/records/${id}`),
  });

  const registro = data?.registro;

  const inicial = useMemo(() => {
    if (!registro) return undefined;
    return {
      sexo: registro.sexo,
      edad: String(registro.edad),
      tipoAtencion: registro.tipoAtencion,
      fechaAtencion: formatearFecha(registro.fechaAtencion),
      cie10: registro.cie10,
    };
  }, [registro]);

  const guardar = async (datos) => {
    try {
      await api.patch(`/records/${id}`, datos);
      mostrar('Registro actualizado', 'exito');
      router.push('/registros');
    } catch (err) {
      mostrar(mensajeDeError(err), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Editar registro</h1>
        <p className="text-sm text-slate-500">
          {registro
            ? `Registrado el ${formatearFecha(registro.createdAt)} · Semana S${registro.semanaEpidemiologica}/${registro.anioEpidemiologico}`
            : 'Cargando registro…'}
        </p>
      </div>

      <Tarjeta>
        {isLoading && <Cargando />}
        {error && <Alerta>{mensajeDeError(error)}</Alerta>}
        {registro && (
          <FormularioRegistro inicial={inicial} onGuardar={guardar} textoBoton="Guardar cambios" />
        )}
      </Tarjeta>

      <p className="text-center text-sm text-slate-500">
        <Link href="/registros" className="font-medium text-indigo-600">
          Volver al listado
        </Link>
      </p>
    </div>
  );
}
