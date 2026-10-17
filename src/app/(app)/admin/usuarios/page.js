'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ROLES } from '@diag/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/toast';
import { Alerta, Boton, Cargando, Insignia, Tarjeta } from '@/components/ui';
import { claseInput, formatearFechaHora, mensajeDeError } from '@/lib/utils';

const FORMULARIO_VACIO = {
  id: null,
  nombre: '',
  email: '',
  rol: 'digitador',
  activo: true,
  password: '',
};

export default function UsuariosPage() {
  const { usuario: usuarioActual } = useAuth();
  const { mostrar } = useToast();
  const cliente = useQueryClient();

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errorFormulario, setErrorFormulario] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['usuarios', pagina, busqueda],
    queryFn: () =>
      api.get(`/users?pagina=${pagina}&limite=20&q=${encodeURIComponent(busqueda)}`),
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const base = {
        nombre: formulario.nombre,
        email: formulario.email,
        rol: formulario.rol,
        activo: formulario.activo,
      };
      if (formulario.id) {
        const datos = { ...base };
        if (formulario.password) datos.password = formulario.password;
        return api.patch(`/users/${formulario.id}`, datos);
      }
      return api.post('/users', { ...base, password: formulario.password });
    },
    onSuccess: () => {
      mostrar(formulario.id ? 'Usuario actualizado' : 'Usuario creado', 'exito');
      setFormulario(FORMULARIO_VACIO);
      setErrorFormulario('');
      cliente.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err) => setErrorFormulario(mensajeDeError(err)),
  });

  const desactivar = useMutation({
    mutationFn: (id) => api.eliminar(`/users/${id}`),
    onSuccess: () => {
      mostrar('Usuario desactivado', 'exito');
      cliente.invalidateQueries({ queryKey: ['usuarios'] });
    },
    onError: (err) => mostrar(mensajeDeError(err), 'error'),
  });

  const enviar = (evento) => {
    evento.preventDefault();
    setErrorFormulario('');
    if (!formulario.nombre.trim() || !formulario.email.trim()) {
      setErrorFormulario('Nombre y correo son obligatorios');
      return;
    }
    if (!formulario.id && formulario.password.length < 8) {
      setErrorFormulario('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    guardar.mutate();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Gestión de usuarios</h1>
        <p className="text-sm text-slate-500">Roles, accesos y estado de las cuentas</p>
      </div>

      <Tarjeta titulo={formulario.id ? 'Editar usuario' : 'Nuevo usuario'}>
        <form onSubmit={enviar} className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
            <input
              className={claseInput(false)}
              value={formulario.nombre}
              onChange={(evento) => setFormulario({ ...formulario, nombre: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Correo</label>
            <input
              type="email"
              className={claseInput(false)}
              value={formulario.email}
              onChange={(evento) => setFormulario({ ...formulario, email: evento.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Rol</label>
            <select
              className={claseInput(false)}
              value={formulario.rol}
              onChange={(evento) => setFormulario({ ...formulario, rol: evento.target.value })}
            >
              {ROLES.map((rol) => (
                <option key={rol} value={rol}>
                  {rol}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              {formulario.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            </label>
            <input
              type="password"
              className={claseInput(false)}
              value={formulario.password}
              onChange={(evento) => setFormulario({ ...formulario, password: evento.target.value })}
              placeholder={formulario.id ? 'Dejar vacío para mantener' : 'Mínimo 8 caracteres'}
            />
          </div>
          <div className="flex items-end gap-2">
            <Boton type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : formulario.id ? 'Guardar' : 'Crear'}
            </Boton>
            {formulario.id && (
              <Boton
                variante="secundario"
                onClick={() => {
                  setFormulario(FORMULARIO_VACIO);
                  setErrorFormulario('');
                }}
              >
                Cancelar
              </Boton>
            )}
          </div>
        </form>
        {errorFormulario && <Alerta className="mt-3">{errorFormulario}</Alerta>}
      </Tarjeta>

      <Tarjeta
        titulo="Usuarios"
        acciones={
          <input
            className={claseInput(false)}
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
              setPagina(1);
            }}
          />
        }
      >
        {isLoading && <Cargando />}
        {error && <Alerta>{mensajeDeError(error)}</Alerta>}

        {data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2 pr-3">Rol</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Creado</th>
                    <th className="py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datos.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3 font-medium">{usuario.nombre}</td>
                      <td className="py-2 pr-3 text-slate-600">{usuario.email}</td>
                      <td className="py-2 pr-3 capitalize">{usuario.rol}</td>
                      <td className="py-2 pr-3">
                        <Insignia color={usuario.activo ? 'emerald' : 'red'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Insignia>
                      </td>
                      <td className="py-2 pr-3 text-xs text-slate-500">
                        {formatearFechaHora(usuario.createdAt)}
                      </td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-indigo-600 hover:underline"
                            onClick={() =>
                              setFormulario({
                                id: usuario.id,
                                nombre: usuario.nombre,
                                email: usuario.email,
                                rol: usuario.rol,
                                activo: usuario.activo,
                                password: '',
                              })
                            }
                          >
                            Editar
                          </button>
                          {usuario.activo && usuario.id !== usuarioActual.id && (
                            <button
                              type="button"
                              className="text-xs font-medium text-red-600 hover:underline"
                              onClick={() => {
                                if (window.confirm(`¿Desactivar a ${usuario.nombre}?`)) {
                                  desactivar.mutate(usuario.id);
                                }
                              }}
                            >
                              Desactivar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                Página {data.pagina} de {data.paginas} · {data.total} usuarios
              </span>
              <div className="flex gap-2">
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((actual) => actual - 1)}
                >
                  Anterior
                </Boton>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  disabled={pagina >= data.paginas}
                  onClick={() => setPagina((actual) => actual + 1)}
                >
                  Siguiente
                </Boton>
              </div>
            </div>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
