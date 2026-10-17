'use client';

const VARIANTES = {
  primario: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  secundario:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400',
  peligro: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
  fantasma: 'text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400',
  exito: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300',
};

const TAMANOS = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Boton({
  children,
  variante = 'primario',
  tamano = 'md',
  className = '',
  ...propiedades
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium shadow-sm transition disabled:cursor-not-allowed ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...propiedades}
    >
      {children}
    </button>
  );
}

export function Tarjeta({ children, className = '', titulo, acciones }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          {titulo && <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>}
          {acciones && <div className="flex items-center gap-2">{acciones}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Insignia({ children, color = 'slate' }) {
  const colores = {
    slate: 'bg-slate-100 text-slate-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    sky: 'bg-sky-100 text-sky-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colores[color] || colores.slate}`}>
      {children}
    </span>
  );
}

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {texto}
    </div>
  );
}

export function Alerta({ children, tipo = 'error', className = '' }) {
  const estilos = {
    error: 'border-red-200 bg-red-50 text-red-700',
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${estilos[tipo]} ${className}`}>{children}</div>
  );
}

export function Campo({ etiqueta, error, ayuda, children, className = '' }) {
  return (
    <div className={className}>
      {etiqueta && <label className="mb-1 block text-sm font-medium text-slate-700">{etiqueta}</label>}
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
