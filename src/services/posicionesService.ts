
import { API_URL } from '@/config/api';
import type { Posicion } from '@/types/posicion';

export async function obtenerPosiciones(
  torneoId: number
): Promise<Posicion[]> {
  const respuesta = await fetch(
    `${API_URL}/api/torneos/${torneoId}/posiciones`
  );

  if (!respuesta.ok) {
    throw new Error('No se pudo cargar la tabla de posiciones');
  }

  return respuesta.json();
}
