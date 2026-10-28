import { Jugador, JugadorRequest } from '../types/jugador';
import { API_URL } from '@/config/api';


async function verificarRespuesta(respuesta: Response) {
  if (respuesta.ok) {
    return;
  }

  const error = await respuesta.json().catch(() => null);

  let mensaje = 'No se pudo completar la operación';

  if (error?.errores) {
    mensaje = Object.values(error.errores).join('\n');
  } else if (error?.detail) {
    mensaje = error.detail;
  } else if (error?.mensaje) {
    mensaje = error.mensaje;
  } else if (error?.message) {
    mensaje = error.message;
  }

  throw new Error(mensaje);
}


export async function listarJugadores(
  equipoId?: number
): Promise<Jugador[]> {
  let url = `${API_URL}/api/jugadores`;


  if (equipoId !== undefined) {
    url += `?equipoId=${equipoId}`;
  }

  const respuesta = await fetch(url);
  await verificarRespuesta(respuesta);

  return respuesta.json();
}

export async function obtenerJugador(id: number): Promise<Jugador> {
  const respuesta = await fetch(`${API_URL}/api/jugadores/${id}`);
  await verificarRespuesta(respuesta);

  return respuesta.json();
}

export async function crearJugador(
  datos: JugadorRequest
): Promise<Jugador> {
  const respuesta = await fetch(`${API_URL}/api/jugadores`, {
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

export async function modificarJugador(
  id: number,
  datos: JugadorRequest
): Promise<Jugador> {
  const respuesta = await fetch(`${API_URL}/api/jugadores/${id}`, {
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

export async function darDeBajaJugador(id: number): Promise<void> {
  const respuesta = await fetch(`${API_URL}/api/jugadores/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  await verificarRespuesta(respuesta);
}
