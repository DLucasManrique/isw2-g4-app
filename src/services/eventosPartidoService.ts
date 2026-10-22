import { solicitarPartido } from '@/services/partidosService';

export type TipoEvento = 'GOL' | 'AMARILLA' | 'ROJA';

export type EventoRequest = {
  jugadorId: number;
  tipo: TipoEvento;
  minuto: number;
};

export type EventoPartido = EventoRequest & {
  id: number;
};

export async function listarEventos(partidoId: number): Promise<EventoPartido[]> {
  const respuesta = await solicitarPartido(`/${partidoId}/eventos`);
  return respuesta.json();
}

export async function registrarEvento(partidoId: number, datos: EventoRequest): Promise<EventoPartido> {
  const respuesta = await solicitarPartido(`/${partidoId}/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function corregirEvento(partidoId: number, eventoId: number, datos: EventoRequest): Promise<EventoPartido> {
  const respuesta = await solicitarPartido(`/${partidoId}/eventos/${eventoId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function eliminarEvento(partidoId: number, eventoId: number): Promise<void> {
  await solicitarPartido(`/${partidoId}/eventos/${eventoId}`, { method: 'DELETE' });
}
