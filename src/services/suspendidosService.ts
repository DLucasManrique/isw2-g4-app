import { API_URL } from '@/config/api';

export interface JugadorSuspendido {
  jugadorId: number;
  nombre: string;
  apellido: string;
  equipoNombre: string;
  motivo: string;
  partidoId: number;
}

export const suspendidosService = {
  obtenerSuspendidos: async (): Promise<JugadorSuspendido[]> => {
    const response = await fetch(`${API_URL}/api/suspendidos`);
    if (!response.ok) {
      throw new Error('Error al obtener la lista de suspendidos');
    }
    return response.json();
  }
};
