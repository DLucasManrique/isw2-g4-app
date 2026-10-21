import { API_URL } from '@/config/api';

export type EstadoPartido = 'PROGRAMADO' | 'EN_JUEGO' | 'FINALIZADO' | 'SUSPENDIDO';

export type Partido = {
  id: number;
  torneoId: number;
  numeroFecha: number;
  equipoLocalId: number;
  equipoVisitanteId: number;
  canchaId: number | null;
  arbitroId: number | null;
  fechaHoraInicio: string | null;
  estado: EstadoPartido;
  golesLocal: number;
  golesVisitante: number;
};

async function solicitarPartidos(ruta: string): Promise<Response> {
  if (!API_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/partidos${ruta}`);
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa la conexión y la URL de la API.');
  }

  if (!respuesta.ok && !(ruta && respuesta.status === 404)) {
    const problema: unknown = await respuesta.json().catch(() => null);
    let mensaje = `No se pudieron consultar los partidos (HTTP ${respuesta.status}).`;
    if (problema && typeof problema === 'object' && 'detail' in problema && typeof problema.detail === 'string') {
      mensaje = problema.detail;
    }
    throw new Error(mensaje);
  }

  return respuesta;
}

export async function listarPartidos(): Promise<Partido[]> {
  const respuesta = await solicitarPartidos('');
  return respuesta.json();
}

export async function obtenerPartido(id: number): Promise<Partido | null> {
  const respuesta = await solicitarPartidos(`/${id}`);
  if (respuesta.status === 404) return null;
  return respuesta.json();
}
