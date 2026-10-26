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
  obtenerUsuario,
} from '../../services/usuariosService';

export default function EditarUsuarioScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [username, setUsername] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState('');
  const [activo, setActivo] = useState(true);
  const [password, setPassword] = useState('');
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
        setActivo(usuario.activo);
        setCargado(true);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'No se pudo cargar el usuario'
        );
      } finally {
        setCargando(false);
      }
    }

    void cargarUsuario();
  }, [id]);

  async function guardar() {
    setError('');

    if (!username.trim() || !nombreCompleto.trim()) {
      setError('Completá los campos obligatorios');
      return;
    }

    if (!rol) {
      setError('Seleccioná un rol');
      return;
    }

    setGuardando(true);

    try {
      await editarUsuario(Number(id), {
        username: username.trim(),
        nombreCompleto: nombreCompleto.trim(),
        password,
        rol,
        activo,
      });

      router.replace('/usuarios');
    } catch (e) {
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
        secureTextEntry
        placeholder="Dejar vacío para no cambiar"
      />

      <Text style={styles.texto}>Rol *</Text>
      <View style={styles.roles}>
        <Button selected={rol === 'ADMIN'}
          title={rol === 'ADMIN' ? '✓ ADMIN' : 'ADMIN'}
          onPress={() => setRol('ADMIN')}
        />
        <Button selected={rol === 'DELEGADO'}
          title={rol === 'DELEGADO' ? '✓ DELEGADO' : 'DELEGADO'}
          onPress={() => setRol('DELEGADO')}
        />
      </View>

      <Text style={styles.texto}>Estado: {activo ? 'Activo' : 'Inactivo'}</Text>

      {error !== '' && <Text style={[styles.texto, styles.error]}>{error}</Text>}

      <Button
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardar}
        disabled={guardando}
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
