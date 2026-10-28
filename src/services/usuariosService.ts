
import { API_URL } from '../config/api';
import { Usuario, UsuarioRequest } from '../types/usuario';

export class ErrorUsuarios extends Error {
  constructor(mensaje: string, public readonly status: number) {
    super(mensaje);
    this.name = 'ErrorUsuarios';
  }
}

async function verificarRespuesta(respuesta: Response) {
  if (respuesta.ok) {
    return;
  }

  if (respuesta.status === 401) throw new ErrorUsuarios('La sesión venció. Iniciá sesión nuevamente.', 401);
  if (respuesta.status === 403) throw new ErrorUsuarios('No tenés permisos para gestionar usuarios. Se requiere un ADMIN.', 403);

  const error = await respuesta.json().catch(() => null);

  const mensaje =
    error?.detail ||
    error?.mensaje ||
    error?.message ||
    `Error al realizar la operación (${respuesta.status})`;

  throw new ErrorUsuarios(mensaje, respuesta.status);
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const respuesta = await fetch(`${API_URL}/api/usuarios`, { credentials: 'include' });
  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/api/usuarios/${id}`, { credentials: 'include' });
  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function crearUsuario(
  datos: UsuarioRequest
): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/api/usuarios`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function editarUsuario(
  id: number,
  datos: UsuarioRequest
): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/api/usuarios/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function darDeBajaUsuario(id: number): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/usuarios/${id}/baja`, {
    method: 'PATCH',
    credentials: 'include',
  });

  await verificarRespuesta(respuesta);
}
