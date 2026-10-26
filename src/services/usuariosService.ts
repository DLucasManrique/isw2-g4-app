
import { API_URL } from '../config/api';
import { Usuario, UsuarioRequest } from '../types/usuario';

async function verificarRespuesta(respuesta: Response) {
  if (respuesta.ok) {
    return;
  }

  const error = await respuesta.json().catch(() => null);

  const mensaje =
    error?.mensaje ||
    error?.message ||
    `Error al realizar la operación (${respuesta.status})`;

  throw new Error(mensaje);
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const respuesta = await fetch(`${API_URL}/usuarios`);
  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}`);
  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function crearUsuario(
  datos: UsuarioRequest
): Promise<Usuario> {
  const respuesta = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
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
  const respuesta = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  await verificarRespuesta(respuesta);
  return respuesta.json();
}

export async function darDeBajaUsuario(id: number): Promise<void> {
  const respuesta = await fetch(`${API_URL}/usuarios/${id}/baja`, {
    method: 'PATCH',
  });

  await verificarRespuesta(respuesta);
}
