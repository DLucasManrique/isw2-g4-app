import { API_URL } from '@/config/api';

export type Equipo = {
  id: number;
  torneoId: number;
  nombre: string;
  barrio: string | null;
  activo: boolean;
};

export type EquipoRequest = {
  torneoId: number;
  nombre: string;
  barrio: string | null;
};

async function solicitarEquipos(ruta: string, opciones?: RequestInit): Promise<Response> {
  if (!API_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/equipos${ruta}`, opciones);
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa la conexión y la URL de la API.');
  }

  if (!respuesta.ok) {
    const problema: unknown = await respuesta.json().catch(() => null);
    let mensaje = `La operación no pudo completarse (HTTP ${respuesta.status}).`;
    if (problema && typeof problema === 'object') {
      if ('detail' in problema && typeof problema.detail === 'string') {
        mensaje = problema.detail;
      }
      if (respuesta.status === 400 && 'errores' in problema && Array.isArray(problema.errores)) {
        const errores = problema.errores.filter((error): error is string => typeof error === 'string');
        if (errores.length > 0) mensaje += `\n${errores.join('\n')}`;
      }
    }
    throw new Error(mensaje);
  }

  return respuesta;
}

export async function listarEquipos(): Promise<Equipo[]> {
  const respuesta = await solicitarEquipos('');
  return respuesta.json();
}

export async function obtenerEquipo(id: number): Promise<Equipo> {
  const respuesta = await solicitarEquipos(`/${id}`);
  return respuesta.json();
}

export async function crearEquipo(datos: EquipoRequest): Promise<Equipo> {
  const respuesta = await solicitarEquipos('', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function actualizarEquipo(id: number, datos: EquipoRequest): Promise<Equipo> {
  const respuesta = await solicitarEquipos(`/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return respuesta.json();
}

export async function darDeBajaEquipo(id: number): Promise<void> {
  await solicitarEquipos(`/${id}`, { method: 'DELETE', credentials: 'include' });
}
