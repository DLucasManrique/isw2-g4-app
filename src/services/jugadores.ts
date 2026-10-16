import { Jugador, JugadorRequest } from '../types/jugador';
import { API_URL } from './api';

async function verificarRespuesta(respuesta: Response) {
  if (respuesta.ok) {
    return;
  }

  const error = await respuesta.json().catch(() => null);

  const mensaje = error?.errores
    ? Object.values(error.errores).join('\n')
    : error?.mensaje;

  throw new Error(mensaje || 'No se pudo completar la operación');
}

export async function listarJugadores(
  equipoId?: number
): Promise<Jugador[]> {
  let url = `${API_URL}/jugadores`;
  console.log('API_URL:', API_URL);

  if (equipoId !== undefined) {
    url += `?equipoId=${equipoId}`;
  }

  const respuesta = await fetch(url);
  await verificarRespuesta(respuesta);

  return respuesta.json();
}

export async function obtenerJugador(id: number): Promise<Jugador> {
  const respuesta = await fetch(`${API_URL}/jugadores/${id}`);
  await verificarRespuesta(respuesta);

  return respuesta.json();
}

export async function crearJugador(
  datos: JugadorRequest
): Promise<Jugador> {
  const respuesta = await fetch(`${API_URL}/jugadores`, {
    method: 'POST',
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
  const respuesta = await fetch(`${API_URL}/jugadores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  });

  await verificarRespuesta(respuesta);

  return respuesta.json();
}

export async function darDeBajaJugador(id: number): Promise<void> {
  const respuesta = await fetch(`${API_URL}/jugadores/${id}`, {
    method: 'DELETE',
  });

  await verificarRespuesta(respuesta);
}