'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const ESTILOS = {
  exito: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-sky-300 bg-sky-50 text-sky-800',
};

export function ToastProvider({ children }) {
  const [mensajes, setMensajes] = useState([]);

  const mostrar = useCallback((texto, tipo = 'info') => {
    const id = Date.now() + Math.random();
    setMensajes((actuales) => [...actuales, { id, texto, tipo }]);
    setTimeout(() => {
      setMensajes((actuales) => actuales.filter((mensaje) => mensaje.id !== id));
    }, 4000);
  }, []);

  const quitar = useCallback((id) => {
    setMensajes((actuales) => actuales.filter((mensaje) => mensaje.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
        {mensajes.map((mensaje) => (
          <button
            key={mensaje.id}
            type="button"
            onClick={() => quitar(mensaje.id)}
            className={`rounded-lg border px-4 py-3 text-left text-sm shadow-lg ${ESTILOS[mensaje.tipo] || ESTILOS.info}`}
          >
            {mensaje.texto}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
}
