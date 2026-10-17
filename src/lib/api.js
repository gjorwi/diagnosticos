const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const CLAVE_TOKEN = 'diag_token';
const CLAVE_REFRESH = 'diag_refresh';

export class ErrorApi extends Error {
  constructor(mensaje, status, codigo, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export function obtenerToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CLAVE_TOKEN);
}

export function obtenerRefreshToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CLAVE_REFRESH);
}

export function guardarTokens({ token, refreshToken }) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(CLAVE_TOKEN, token);
  if (refreshToken) window.localStorage.setItem(CLAVE_REFRESH, refreshToken);
}

export function limpiarTokens() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CLAVE_TOKEN);
  window.localStorage.removeItem(CLAVE_REFRESH);
}

let refrescoEnCurso = null;

async function refrescarSesion() {
  if (!refrescoEnCurso) {
    const refreshToken = obtenerRefreshToken();
    if (!refreshToken) return false;

    refrescoEnCurso = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (respuesta) => {
        if (!respuesta.ok) return false;
        const datos = await respuesta.json();
        guardarTokens(datos);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refrescoEnCurso = null;
      });
  }
  return refrescoEnCurso;
}

function expirarSesion() {
  limpiarTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('diag:sesion-expirada'));
  }
}

async function construirError(respuesta) {
  let cuerpo = {};
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = {};
  }
  const error = cuerpo.error || {};
  return new ErrorApi(
    error.mensaje || `Error ${respuesta.status}`,
    respuesta.status,
    error.codigo || 'ERROR',
    error.detalles
  );
}

async function pedir(ruta, opciones = {}, reintentar = true) {
  const config = {
    method: opciones.method || 'GET',
    headers: { ...(opciones.headers || {}) },
  };

  const token = obtenerToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (opciones.json !== undefined) {
    config.body = JSON.stringify(opciones.json);
    config.headers['Content-Type'] = 'application/json';
  } else if (opciones.body !== undefined) {
    config.body = opciones.body;
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, config);

  const sinRefresco = ruta === '/auth/login' || ruta === '/auth/refresh' || ruta === '/auth/logout';
  if (respuesta.status === 401 && reintentar && !sinRefresco) {
    const refrescoOk = await refrescarSesion();
    if (refrescoOk) return pedir(ruta, opciones, false);
    expirarSesion();
  }

  if (!respuesta.ok) throw await construirError(respuesta);
  if (respuesta.status === 204) return null;

  const tipo = respuesta.headers.get('content-type') || '';
  if (tipo.includes('application/json')) return respuesta.json();
  return respuesta;
}

export const api = {
  get: (ruta) => pedir(ruta),
  post: (ruta, json) => pedir(ruta, { method: 'POST', json }),
  put: (ruta, json) => pedir(ruta, { method: 'PUT', json }),
  patch: (ruta, json) => pedir(ruta, { method: 'PATCH', json }),
  eliminar: (ruta) => pedir(ruta, { method: 'DELETE' }),

  subir: (ruta, formData) => pedir(ruta, { method: 'POST', body: formData }),

  async descargar(ruta, nombreArchivo) {
    const solicitar = async () => {
      const cabeceras = {};
      const token = obtenerToken();
      if (token) cabeceras.Authorization = `Bearer ${token}`;
      return fetch(`${API_URL}${ruta}`, { headers: cabeceras });
    };

    let respuesta = await solicitar();
    if (respuesta.status === 401) {
      const refrescoOk = await refrescarSesion();
      if (refrescoOk) respuesta = await solicitar();
      else expirarSesion();
    }
    if (!respuesta.ok) throw await construirError(respuesta);

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    window.URL.revokeObjectURL(url);
  },
};

export { API_URL };
