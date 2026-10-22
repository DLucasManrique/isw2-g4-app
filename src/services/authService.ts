import { API_URL } from '@/config/api';

export type UsuarioSesion = {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: string;
};

export function esUsuarioSesion(datos: unknown): datos is UsuarioSesion {
  return typeof datos === 'object' && datos !== null &&
    'id' in datos && typeof datos.id === 'number' && Number.isInteger(datos.id) && datos.id > 0 &&
    'username' in datos && typeof datos.username === 'string' &&
    'nombreCompleto' in datos && typeof datos.nombreCompleto === 'string' &&
    'rol' in datos && typeof datos.rol === 'string';
}

export async function iniciarSesion(username: string, password: string): Promise<UsuarioSesion> {
  if (!API_URL) {
    throw new Error('Falta configurar EXPO_PUBLIC_API_URL para conectar con el backend.');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('No se pudo conectar con el backend. Revisa la conexión y la URL de la API.');
  }

  if (respuesta.status === 401) {
    throw new Error('Usuario o contraseña incorrectos');
  }
  if (!respuesta.ok) {
    const problema: unknown = await respuesta.json().catch(() => null);
    let mensaje = respuesta.status === 400
      ? 'Revisa el usuario y la contraseña ingresados.'
      : `No se pudo iniciar sesión (HTTP ${respuesta.status}).`;
    if (respuesta.status === 400 && problema && typeof problema === 'object') {
      if ('detail' in problema && typeof problema.detail === 'string') mensaje = problema.detail;
      if ('errores' in problema && Array.isArray(problema.errores)) {
        const errores = problema.errores.filter((error): error is string => typeof error === 'string');
        if (errores.length > 0) mensaje += `\n${errores.join('\n')}`;
      }
    }
    throw new Error(mensaje);
  }

  const datos: unknown = await respuesta.json().catch(() => null);
  if (!esUsuarioSesion(datos)) throw new Error('El backend devolvió una sesión inválida.');
  return { id: datos.id, username: datos.username, nombreCompleto: datos.nombreCompleto, rol: datos.rol };
}
