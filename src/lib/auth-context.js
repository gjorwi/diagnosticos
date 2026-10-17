'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, guardarTokens, limpiarTokens, obtenerToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    if (!obtenerToken()) {
      setUsuario(null);
      setPermisos([]);
      setCargando(false);
      return;
    }
    try {
      const datos = await api.get('/auth/me');
      setUsuario(datos.usuario);
      setPermisos(datos.permisos);
    } catch {
      limpiarTokens();
      setUsuario(null);
      setPermisos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSesion();
  }, [cargarSesion]);

  useEffect(() => {
    const manejarExpiracion = () => {
      limpiarTokens();
      setUsuario(null);
      setPermisos([]);
      setCargando(false);
    };
    window.addEventListener('diag:sesion-expirada', manejarExpiracion);
    return () => window.removeEventListener('diag:sesion-expirada', manejarExpiracion);
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const datos = await api.post('/auth/login', { email, password });
    guardarTokens(datos);
    setUsuario(datos.usuario);
    setPermisos(datos.permisos);
    return datos.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // la sesión local se cierra igual
    } finally {
      limpiarTokens();
      setUsuario(null);
      setPermisos([]);
    }
  }, []);

  const tienePermiso = useCallback((permiso) => permisos.includes(permiso), [permisos]);

  const valor = useMemo(
    () => ({ usuario, permisos, cargando, iniciarSesion, cerrarSesion, tienePermiso, cargarSesion }),
    [usuario, permisos, cargando, iniciarSesion, cerrarSesion, tienePermiso, cargarSesion]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}
