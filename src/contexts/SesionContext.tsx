import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { cerrarSesionRemota, esUsuarioSesion, type UsuarioSesion } from '@/services/authService';

const CLAVE_SESION = 'liga.sesion';

const SesionContext = createContext<{
  usuario: UsuarioSesion | null;
  cargando: boolean;
  error: string;
  guardarSesion: (usuario: UsuarioSesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  invalidarSesion: () => Promise<void>;
} | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function restaurarSesion() {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_SESION);
        if (guardado) {
          const datos: unknown = JSON.parse(guardado);
          if (esUsuarioSesion(datos)) {
            setUsuario({ id: datos.id, username: datos.username, nombreCompleto: datos.nombreCompleto, rol: datos.rol, equipoId: datos.equipoId });
          } else {
            await AsyncStorage.removeItem(CLAVE_SESION);
          }
        }
      } catch {
        setError('No se pudo recuperar la sesión guardada. Inicia sesión nuevamente.');
      } finally {
        setCargando(false);
      }
    }
    void restaurarSesion();
  }, []);

  async function guardarSesion(datos: UsuarioSesion) {
    const sesion = { id: datos.id, username: datos.username, nombreCompleto: datos.nombreCompleto, rol: datos.rol, equipoId: datos.equipoId };
    try {
      await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      throw new Error('No se pudo guardar la sesión. Intenta nuevamente.');
    }
    setError('');
    setUsuario(sesion);
  }

  const limpiarSesionLocal = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(CLAVE_SESION);
    } catch {
      setError('No se pudo eliminar la sesión guardada del dispositivo.');
    } finally {
      setUsuario(null);
    }
  }, []);

  const invalidarSesion = useCallback(async () => {
    await limpiarSesionLocal();
    setError('La sesión venció. Iniciá sesión nuevamente.');
  }, [limpiarSesionLocal]);

  async function cerrarSesion() {
    setError('');
    await cerrarSesionRemota().catch(() => undefined);
    await limpiarSesionLocal();
  }

  return (
    <SesionContext.Provider value={{ usuario, cargando, error, guardarSesion, cerrarSesion, invalidarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) throw new Error('useSesion debe usarse dentro de SesionProvider.');
  return sesion;
}
