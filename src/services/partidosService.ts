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
  fechaHoraInicio: string;
  estado: EstadoPartido;
  golesLocal: number;
  golesVisitante: number;
};

export type PartidoRequest = Pick<Partido,
  'numeroFecha' | 'equipoLocalId' | 'equipoVisitanteId' |
  'canchaId' | 'arbitroId' | 'fechaHoraInicio'>;

export async function crearPartido(datos: PartidoRequest): Promise<Omit<Partido, 'golesLocal' | 'golesVisitante'>> {
  const respuesta = await solicitarPartido('', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function solicitarPartido(ruta: string, opciones?: RequestInit, permitir404 = false): Promise<Response> {
  if (!API_URL) throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/partidos${ruta}`, opciones);
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa la conexión. Si estabas guardando, actualiza antes de repetir la operación.');
  }

  if (!respuesta.ok && !(permitir404 && respuesta.status === 404)) {
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

export async function listarPartidos(): Promise<Partido[]> {
  const respuesta = await solicitarPartido('');
  return respuesta.json();
}

export async function obtenerPartido(id: number): Promise<Partido | null> {
  const respuesta = await solicitarPartido(`/${id}`, undefined, true);
  if (respuesta.status === 404) return null;
  return respuesta.json();
}

export async function cambiarEstadoPartido(id: number, estado: EstadoPartido): Promise<Omit<Partido, 'golesLocal' | 'golesVisitante'>> {
  const respuesta = await solicitarPartido(`/${id}/estado`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  return respuesta.json();
}
