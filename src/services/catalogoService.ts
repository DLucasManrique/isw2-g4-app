import { API_URL } from '../config/api';

export type Torneo = { id: number; nombre: string; anio: number; activo: boolean };
export type Cancha = { id: number; nombre: string; direccion: string; activo: boolean };
export type Arbitro = { id: number; nombre: string; apellido: string; dni: string; activo: boolean };

async function obtenerCatalogo<T>(seccion: string): Promise<T[]> {
  const response = await fetch(`${API_URL}/api/catalogo/${seccion}`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el catálogo de ${seccion} (HTTP ${response.status}).`);
  }
  const datos: unknown = await response.json();
  if (!Array.isArray(datos)) throw new Error('El backend devolvió un catálogo inválido.');
  return datos;
}

export function getTorneos(): Promise<Torneo[]> {
  return obtenerCatalogo<Torneo>('torneos');
}

export function getCanchas(): Promise<Cancha[]> {
  return obtenerCatalogo<Cancha>('canchas');
}

export function getArbitros(): Promise<Arbitro[]> {
  return obtenerCatalogo<Arbitro>('arbitros');
}
