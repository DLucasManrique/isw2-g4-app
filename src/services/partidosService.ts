import { API_URL } from '@/config/api';

export type EstadoPartido = 'PROGRAMADO' | 'EN_JUEGO' | 'FINALIZADO' | 'SUSPENDIDO';

export type Partido = {
  id: number;
  torneoId: number;
  numeroFecha: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  canchaId: number;
  arbitroId: number;
  fechaHoraInicio: string | null;
  estado: EstadoPartido;
};

export async function solicitarPartido(ruta: string, opciones?: RequestInit): Promise<Response> {
  if (!API_URL) throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/partidos${ruta}`, opciones);
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa la conexión. Si estabas guardando, actualiza antes de repetir la operación.');
  }

  if (!respuesta.ok) {
    const problema: unknown = await respuesta.json().catch(() => null);
    let mensaje = `La operación no pudo completarse (HTTP ${respuesta.status}).`;
    if (problema && typeof problema === 'object') {
      if ('detail' in problema && typeof problema.detail === 'string') mensaje = problema.detail;
      if ('errores' in problema && Array.isArray(problema.errores)) {
        const errores = problema.errores.filter((error): error is string => typeof error === 'string');
        if (errores.length > 0) mensaje += `\n${errores.join('\n')}`;
      }
    }
    throw new Error(mensaje);
  }
  return respuesta;
}

export async function obtenerPartido(id: number): Promise<Partido> {
  const respuesta = await solicitarPartido(`/${id}`);
  return respuesta.json();
}

export async function cambiarEstadoPartido(id: number, estado: EstadoPartido): Promise<Partido> {
  const respuesta = await solicitarPartido(`/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  return respuesta.json();
}
