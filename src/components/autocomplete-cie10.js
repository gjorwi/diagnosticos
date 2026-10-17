'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { claseInput, mensajeDeError } from '@/lib/utils';

export function BuscadorCie10({ onSeleccionar, seleccionado, error, autoFocus }) {
  const { tienePermiso } = useAuth();
  const [consulta, setConsulta] = useState(seleccionado ? seleccionado.codigo : '');
  const [resultados, setResultados] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [indice, setIndice] = useState(-1);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorLocal, setErrorLocal] = useState('');
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (seleccionado) setConsulta(seleccionado.codigo);
  }, [seleccionado]);

  const buscar = useCallback(async (texto) => {
    setCargando(true);
    setMensaje(null);
    try {
      const datos = await api.get(`/cie10/search?q=${encodeURIComponent(texto)}&limite=15`);
      const lista = datos.resultados || [];
      setResultados(lista);
      setIndice(lista.length ? 0 : -1);
      setAbierto(true);

      if (datos.total === 0) {
        setMensaje({
          tipo: 'vacio',
          texto: 'El catálogo CIE-10 está vacío. Debe cargarse antes de registrar diagnósticos.',
        });
      } else if (!lista.length) {
        setMensaje({
          tipo: 'sin-resultados',
          texto: `Sin coincidencias para "${texto}". Prueba con otro código o nombre.`,
        });
      }
    } catch (err) {
      setResultados([]);
      setIndice(-1);
      setAbierto(true);
      setMensaje({
        tipo: 'error',
        texto: `No se pudo consultar el catálogo: ${mensajeDeError(err)}`,
      });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (seleccionado && consulta.trim() === seleccionado.codigo) return undefined;
    const texto = consulta.trim();
    if (!texto) return undefined;
    const temporizador = setTimeout(() => buscar(texto), 250);
    return () => clearTimeout(temporizador);
  }, [consulta, seleccionado, buscar]);

  useEffect(() => {
    const manejarClic = (evento) => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', manejarClic);
    return () => document.removeEventListener('mousedown', manejarClic);
  }, []);

  const elegir = (resultado) => {
    onSeleccionar(resultado);
    setConsulta(resultado.codigo);
    setAbierto(false);
    setResultados([]);
    setMensaje(null);
    setErrorLocal('');
  };

  const limpiarSeleccion = () => {
    onSeleccionar(null);
    setConsulta('');
    setResultados([]);
    setMensaje(null);
    setErrorLocal('');
    buscar('');
    inputRef.current?.focus();
  };

  const manejarTeclado = (evento) => {
    if (evento.key === 'ArrowDown') {
      if (!resultados.length) return;
      evento.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      setIndice((actual) => (actual + 1) % resultados.length);
      return;
    }

    if (evento.key === 'ArrowUp') {
      if (!resultados.length) return;
      evento.preventDefault();
      setIndice((actual) => (actual - 1 + resultados.length) % resultados.length);
      return;
    }

    if (evento.key === 'Enter') {
      if (!resultados.length) return;
      evento.preventDefault();
      const resultado = abierto && indice >= 0 ? resultados[indice] : resultados[0];
      if (resultado) elegir(resultado);
      return;
    }

    if (evento.key === 'Escape') {
      setAbierto(false);
      setMensaje(null);
    }
  };

  const errorMostrado = error || errorLocal;

  return (
    <div ref={contenedorRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={consulta}
        autoFocus={autoFocus}
        placeholder="Busca y selecciona: código (ej: E11) o nombre (ej: diabetes)"
        autoComplete="off"
        className={claseInput(errorMostrado)}
        onChange={(evento) => {
          setConsulta(evento.target.value);
          setErrorLocal('');
          setMensaje(null);
          if (seleccionado) onSeleccionar(null);
        }}
        onFocus={() => {
          if (seleccionado) return;
          if (resultados.length) setAbierto(true);
          else buscar(consulta.trim());
        }}
        onBlur={() => {
          window.setTimeout(() => {
            setAbierto(false);
            if (!seleccionado && consulta.trim()) {
              setConsulta('');
              setResultados([]);
              setErrorLocal('Selecciona un diagnóstico de la lista; no se permite texto libre.');
            }
          }, 150);
        }}
        onKeyDown={manejarTeclado}
      />

      {cargando && (
        <span className="absolute top-2.5 right-3 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      )}

      {abierto && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          {cargando && <p className="px-3 py-2 text-sm text-slate-500">Buscando en el catálogo…</p>}

          {!cargando && resultados.length > 0 && (
            <ul className="max-h-64 overflow-auto py-1">
              {resultados.map((resultado, posicion) => (
                <li key={resultado.codigo}>
                  <button
                    type="button"
                    onMouseDown={(evento) => evento.preventDefault()}
                    onClick={() => elegir(resultado)}
                    className={`flex w-full items-start gap-3 px-3 py-2 text-left text-sm ${
                      posicion === indice ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-indigo-700">
                      {resultado.codigo}
                    </span>
                    <span className="text-slate-700">{resultado.descripcion}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!cargando && mensaje && (
            <div className="px-3 py-2 text-sm">
              <p className={mensaje.tipo === 'error' ? 'text-red-600' : 'text-slate-500'}>
                {mensaje.texto}
              </p>
              {mensaje.tipo === 'error' && (
                <button
                  type="button"
                  onClick={() => buscar(consulta.trim())}
                  className="mt-1 text-xs font-medium text-indigo-600 hover:underline"
                >
                  Reintentar
                </button>
              )}
              {mensaje.tipo === 'vacio' &&
                (tienePermiso('catalog.manage') ? (
                  <Link
                    href="/admin/catalogo"
                    className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Ir a Catálogo CIE-10 para cargarlo
                  </Link>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    Solicita a un administrador que cargue el catálogo en Admin → Catálogo CIE-10.
                  </p>
                ))}
            </div>
          )}
        </div>
      )}

      {seleccionado ? (
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-xs text-slate-500">
            Seleccionado: <span className="font-mono font-semibold">{seleccionado.codigo}</span> —{' '}
            {seleccionado.descripcion}
          </p>
          <button
            type="button"
            onClick={limpiarSeleccion}
            className="shrink-0 text-xs font-medium text-indigo-600 hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : null}
    </div>
  );
}
