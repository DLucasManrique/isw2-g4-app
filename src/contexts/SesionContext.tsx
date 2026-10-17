import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { esUsuarioSesion, type UsuarioSesion } from '@/services/authService';

const CLAVE_SESION = 'liga.sesion';

const SesionContext = createContext<{
  usuario: UsuarioSesion | null;
  cargando: boolean;
  error: string;
  guardarSesion: (usuario: UsuarioSesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
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
            setUsuario({ id: datos.id, username: datos.username, nombreCompleto: datos.nombreCompleto, rol: datos.rol });
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
    const sesion = { id: datos.id, username: datos.username, nombreCompleto: datos.nombreCompleto, rol: datos.rol };
    try {
      await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      throw new Error('No se pudo guardar la sesión. Intenta nuevamente.');
    }
    setError('');
    setUsuario(sesion);
  }

  async function cerrarSesion() {
    try {
      await AsyncStorage.removeItem(CLAVE_SESION);
    } catch {
      throw new Error('No se pudo cerrar la sesión. Intenta nuevamente.');
    }
    setUsuario(null);
  }

  return (
    <SesionContext.Provider value={{ usuario, cargando, error, guardarSesion, cerrarSesion }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const sesion = useContext(SesionContext);
  if (!sesion) throw new Error('useSesion debe usarse dentro de SesionProvider.');
  return sesion;
}
