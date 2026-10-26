export type Jugador = {
  id: number;
  equipoId: number;
  nombre: string;
  apellido: string;
  dni: string;
  numeroCamiseta: number | null;
  activo: boolean;
};

export type JugadorRequest = {
  equipoId: number;
  nombre: string;
  apellido: string;
  dni: string;
  numeroCamiseta: number | null;
};