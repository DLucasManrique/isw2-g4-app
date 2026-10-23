
export interface JugadorSuspendido {
  jugadorId: number;
  nombre: string;
  apellido: string;
  equipoNombre: string;
  motivo: string;
  fechasSancion: number;
}

export const suspendidosService = {
  obtenerSuspendidos: async (): Promise<JugadorSuspendido[]> => {
    // Si usan fetch o axios según tu proyecto:
    const response = await fetch('http://localhost:8080/api/suspendidos');
    if (!response.ok) {
      throw new Error('Error al obtener la lista de suspendidos');
    }
    return response.json();
  }
};