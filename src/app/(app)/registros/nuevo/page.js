'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import { FormularioRegistro } from '@/components/formulario-registro';
import { Tarjeta } from '@/components/ui';
import { fechaDeHoy, mensajeDeError } from '@/lib/utils';

export default function NuevoRegistroPage() {
  const { mostrar } = useToast();
  const [guardados, setGuardados] = useState(0);
  const [inicial, setInicial] = useState({ fechaAtencion: fechaDeHoy(), tipoAtencion: 'consulta' });
  const contadorRef = useRef(0);

  const guardar = async (datos) => {
    try {
      await api.post('/records', datos);
      contadorRef.current += 1;
      setGuardados(contadorRef.current);
      setInicial((actual) => ({
        fechaAtencion: datos.fechaAtencion || actual.fechaAtencion,
        tipoAtencion: datos.tipoAtencion,
      }));
      mostrar(`Registro guardado (${contadorRef.current} en esta sesión)`, 'exito');
    } catch (error) {
      mostrar(mensajeDeError(error), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nuevo registro epidemiológico</h1>
        <p className="text-sm text-slate-500">
          Ingreso rápido desde formulario físico. Los datos son anónimos: sin identificación de pacientes.
        </p>
      </div>

      {guardados > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {guardados} registro(s) guardado(s) en esta sesión. La fecha y el tipo de atención se mantienen
          para agilizar la digitación.
        </div>
      )}

      <Tarjeta>
        <FormularioRegistro inicial={inicial} onGuardar={guardar} textoBoton="Guardar y continuar" />
      </Tarjeta>

      <p className="text-center text-sm text-slate-500">
        ¿Necesitas revisar lo cargado? <Link href="/registros" className="font-medium text-indigo-600">Ver registros</Link>
      </p>
    </div>
  );
}
