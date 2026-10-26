import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { crearUsuario } from '../../services/usuariosService';

export default function NuevoUsuarioScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
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
      <Text style={[styles.texto, styles.titulo]}>Registrar usuario</Text>

      <Text style={styles.texto}>Nombre completo *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={nombreCompleto}
        onChangeText={setNombreCompleto}
        placeholder="Ej: Juan Pérez"
      />

      <Text style={styles.texto}>Nombre de usuario *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Ej: jperez"
      />

      <Text style={styles.texto}>Contraseña *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Ingresar contraseña"
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

      {error !== '' && <Text style={[styles.texto, styles.error]}>{error}</Text>}

      {guardando ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Guardar usuario" onPress={guardar} />
      )}

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
