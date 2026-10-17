import { formatearFecha } from '@diag/shared';

export { formatearFecha };

export function formatearFechaHora(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fechaDeHoy() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

export function claseInput(error) {
  const base =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:ring-2';
  return error
    ? `${base} border-red-400 focus:border-red-500 focus:ring-red-200`
    : `${base} border-slate-300 focus:border-indigo-500 focus:ring-indigo-200`;
}

export function acortar(texto, maximo = 60) {
  if (!texto) return '';
  return texto.length > maximo ? `${texto.slice(0, maximo - 1)}…` : texto;
}

export function mensajeDeError(error) {
  if (!error) return 'Ocurrió un error inesperado';
  if (Array.isArray(error.detalles) && error.detalles.length) {
    return error.detalles.map((detalle) => detalle.mensaje).join('; ');
  }
  return error.message || 'Ocurrió un error inesperado';
}
