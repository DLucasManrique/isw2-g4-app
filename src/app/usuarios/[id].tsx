import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  editarUsuario,
  ErrorUsuarios,
  obtenerUsuario,
} from '../../services/usuariosService';
import { listarEquipos, type Equipo } from '@/services/equiposService';
import { useSesion } from '@/contexts/SesionContext';
import { REGLAS_PASSWORD, validarPassword } from '@/utils/validarPassword';

export default function EditarUsuarioScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { invalidarSesion } = useSesion();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [username, setUsername] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState(true);
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [intentoEquipos, setIntentoEquipos] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const usuario = await obtenerUsuario(Number(id));

        setUsername(usuario.username);
        setNombreCompleto(usuario.nombreCompleto);
        setRol(usuario.rol);
        setEquipoId(usuario.equipoId);
        setActivo(usuario.activo);
        setCargado(true);
      } catch (e) {
        if (e instanceof ErrorUsuarios && e.status === 401) {
          await invalidarSesion();
          return;
        }
        setError(
          e instanceof Error ? e.message : 'No se pudo cargar el usuario'
        );
      } finally {
        setCargando(false);
      }
    }

    void cargarUsuario();
  }, [id, invalidarSesion]);

  useEffect(() => {
    if (rol !== 'DELEGADO') return;
    let vigente = true;
    setCargandoEquipos(true);
    setErrorEquipos('');
    async function cargarEquipos() {
      try {
        const datos = await listarEquipos();
        if (vigente) setEquipos(datos);
      } catch (error) {
        if (vigente) setErrorEquipos(error instanceof Error ? error.message : 'No se pudieron cargar los equipos.');
      } finally {
        if (vigente) setCargandoEquipos(false);
      }
    }
    void cargarEquipos();
    return () => { vigente = false; };
  }, [rol, intentoEquipos]);

  async function guardar() {
    if (guardando) return;
    setError('');

    if (!username.trim() || !nombreCompleto.trim()) {
      setError('Completá los campos obligatorios');
      return;
    }

    if (!rol) {
      setError('Seleccioná un rol');
      return;
    }

    if (password !== '') {
      const errorPassword = validarPassword(password);
      if (errorPassword) {
        setError(errorPassword);
        return;
      }
    }
    if (rol === 'DELEGADO' && (cargandoEquipos || errorEquipos || !equipos.some((equipo) => equipo.id === equipoId))) {
      setError('Seleccioná un equipo existente para el delegado.');
      return;
    }

    setGuardando(true);

    try {
      await editarUsuario(Number(id), {
        username: username.trim(),
        nombreCompleto: nombreCompleto.trim(),
        password,
        rol,
        equipoId: rol === 'ADMIN' ? null : equipoId,
        activo,
      });

      router.replace('/usuarios');
    } catch (e) {
      if (e instanceof ErrorUsuarios && e.status === 401) {
        await invalidarSesion();
        return;
      }
      setError(
        e instanceof Error ? e.message : 'No se pudo editar el usuario'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <ActivityIndicator size="large" />;
  }

  if (!cargado) {
    return (
      <View style={styles.contenedor}>
        <Text style={[styles.texto, styles.error]}>{error}</Text>
        <Button variant="secondary"
          title="Volver"
          onPress={() => router.replace('/usuarios')}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={[styles.texto, styles.titulo]}>Editar usuario</Text>

      <Text style={styles.texto}>Nombre completo *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={nombreCompleto}
        onChangeText={setNombreCompleto}
      />

      <Text style={styles.texto}>Nombre de usuario (no modificable)</Text>
<TextInput
  placeholderTextColor={theme.textSecondary}
  style={styles.input}
  value={username}
  editable={false}
/>

      <Text style={styles.texto}>Nueva contraseña (opcional)</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!mostrarPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Dejar vacío para no cambiar"
      />

      <Text style={styles.texto}>{REGLAS_PASSWORD} Dejá el campo vacío para conservar la actual.</Text>
      <Button variant="secondary" title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setMostrarPassword(!mostrarPassword)} />

      <Text style={styles.texto}>Rol: {rol}</Text>

      {rol === 'DELEGADO' && (
        <View style={styles.roles}>
          <Text style={styles.texto}>Equipo *</Text>
          {cargandoEquipos ? <ActivityIndicator /> : errorEquipos ? (
            <>
              <Text style={styles.error} accessibilityRole="alert">{errorEquipos}</Text>
              <Button variant="secondary" title="Reintentar equipos" onPress={() => setIntentoEquipos((valor) => valor + 1)} />
            </>
          ) : equipos.length === 0 ? (
            <Text style={styles.texto}>Primero debe crearse un equipo para registrar un delegado.</Text>
          ) : equipos.map((equipo) => (
            <Button key={equipo.id} title={equipo.nombre} selected={equipo.id === equipoId} disabled={guardando} onPress={() => setEquipoId(equipo.id)} />
          ))}
        </View>
      )}

      <Text style={styles.texto}>Estado: {activo ? 'Activo' : 'Inactivo'}</Text>

      {error !== '' && <Text style={[styles.texto, styles.error]}>{error}</Text>}

      <Button
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardar}
        disabled={guardando || (rol === 'DELEGADO' && (cargandoEquipos || !!errorEquipos || equipos.length === 0))}
      />

      <Button variant="secondary"
        title="Cancelar"
        onPress={() => router.replace('/usuarios')}
      />
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    texto: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    contenedor: {
      flexGrow: 1,
      ...Visual.content,
      backgroundColor: theme.background,
    },
    titulo: {
      marginBottom: 10,
      ...Visual.title,
    },
    input: {
      padding: 12,
      ...Visual.input,
      color: theme.text,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
    roles: {
      gap: 8,
    },
    error: {
      ...Visual.message,
      color: theme.danger,
      backgroundColor: theme.dangerBackground,
    },
  });
