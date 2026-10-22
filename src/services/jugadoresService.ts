import { API_URL } from '@/config/api';

export type Jugador = {
  id: number;
  equipoId: number;
  nombre: string;
  apellido: string;
  numeroCamiseta: number | null;
  activo: boolean;
};

export async function listarJugadoresPorEquipo(equipoId: number): Promise<Jugador[]> {
  if (!API_URL) throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/jugadores?equipoId=${equipoId}`);
  } catch {
    throw new Error('No se pudo conectar con el backend para cargar los jugadores.');
  }
  if (!respuesta.ok) {
    const problema: unknown = await respuesta.json().catch(() => null);
    let mensaje = `No se pudieron cargar los jugadores (HTTP ${respuesta.status}).`;
    if (problema && typeof problema === 'object') {
      if ('detail' in problema && typeof problema.detail === 'string') mensaje = problema.detail;
      if ('errores' in problema && Array.isArray(problema.errores)) {
        const errores = problema.errores.filter((error): error is string => typeof error === 'string');
        if (errores.length > 0) mensaje += `\n${errores.join('\n')}`;
      }
    }
    throw new Error(mensaje);
  }
  return respuesta.json();
}
