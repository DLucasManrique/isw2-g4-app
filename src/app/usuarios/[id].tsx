
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
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
        <Text style={styles.error}>{error}</Text>
        <Button
          title="Volver"
          onPress={() => router.replace('/usuarios')}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Editar usuario</Text>

      <Text>Nombre completo *</Text>
      <TextInput
        style={styles.input}
        value={nombreCompleto}
        onChangeText={setNombreCompleto}
      />

      <Text>Nombre de usuario (no modificable)</Text>
<TextInput
  style={styles.input}
  value={username}
  editable={false}
/>

      <Text>Nueva contraseña (opcional)</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Dejar vacío para no cambiar"
      />

      <Text>Rol *</Text>
      <View style={styles.roles}>
        <Button
          title={rol === 'ADMIN' ? '✓ ADMIN' : 'ADMIN'}
          onPress={() => setRol('ADMIN')}
        />
        <Button
          title={rol === 'DELEGADO' ? '✓ DELEGADO' : 'DELEGADO'}
          onPress={() => setRol('DELEGADO')}
        />
      </View>

      <Text>Estado: {activo ? 'Activo' : 'Inactivo'}</Text>

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <Button
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardar}
        disabled={guardando}
      />

      <Button
        title="Cancelar"
        onPress={() => router.replace('/usuarios')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 12,
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
  },
  roles: {
    gap: 8,
  },
  error: {
    color: '#b00020',
  },
});
