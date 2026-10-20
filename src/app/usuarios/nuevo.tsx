
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { crearUsuario } from '../../services/usuariosService';

export default function NuevoUsuarioScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [rol, setRol] = useState('DELEGADO');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setError('');

    if (!username.trim() || !password.trim() || !nombreCompleto.trim()) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (guardando) {
      return;
    }

    setGuardando(true);

    try {
      await crearUsuario({
        username: username.trim(),
        password,
        nombreCompleto: nombreCompleto.trim(),
        rol,
        activo: true,
      });

      router.replace('/usuarios');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo crear el usuario'
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Registrar usuario</Text>

      <Text>Nombre completo *</Text>
      <TextInput
        style={styles.input}
        value={nombreCompleto}
        onChangeText={setNombreCompleto}
        placeholder="Ej: Juan Pérez"
      />

      <Text>Nombre de usuario *</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Ej: jperez"
      />

      <Text>Contraseña *</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Ingresar contraseña"
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

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      {guardando ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Guardar usuario" onPress={guardar} />
      )}

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
