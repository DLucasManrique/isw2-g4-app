import { API_URL } from '@/config/api';

export type Equipo = {
  id: number;
  nombre: string;
};

export async function listarEquipos(): Promise<Equipo[]> {
  const respuesta = await fetch(`${API_URL}/api/equipos`);

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);

    throw new Error(
      error?.mensaje || 'No se pudieron cargar los equipos'
    );
  }

  return respuesta.json();
}
