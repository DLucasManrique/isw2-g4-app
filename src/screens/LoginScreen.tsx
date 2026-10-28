import { AppButton as Button } from '@/components/app-button';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Visual } from '@/constants/theme';
import { useSesion } from '@/contexts/SesionContext';
import { useTheme } from '@/hooks/use-theme';
import { iniciarSesion } from '@/services/authService';

export default function LoginScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { guardarSesion, error: errorSesion } = useSesion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function ingresar() {
    if (cargando) return;
    if (!username.trim() || !password.trim()) {
      setError('El usuario y la contraseña son obligatorios.');
      return;
    }
    setError('');
    setCargando(true);
    try {
      const usuario = await iniciarSesion(username.trim(), password);
      await guardarSesion(usuario);
      setPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  const estiloCampo = [styles.campo, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <ThemedText type="smallBold" style={{ color: theme.primary }}>Liga Amateur Santafesina</ThemedText>
            <ThemedText type="title">Inicio de sesión</ThemedText>
            <ThemedText themeColor="textSecondary">Ingresá para gestionar y seguir la liga.</ThemedText>
            <ThemedText>Usuario</ThemedText>
            <TextInput accessibilityLabel="Usuario" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!cargando} style={estiloCampo} />
            <ThemedText>Contraseña</ThemedText>
            <TextInput accessibilityLabel="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={!mostrarPassword} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!cargando} style={estiloCampo} onSubmitEditing={() => void ingresar()} />
            <Button variant="secondary" title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} disabled={cargando} onPress={() => setMostrarPassword(!mostrarPassword)} />
            {!!(error || errorSesion) && <ThemedText accessibilityRole="alert">{error || errorSesion}</ThemedText>}
            {cargando && <ActivityIndicator accessibilityLabel="Iniciando sesión" />}
            <Button title={cargando ? 'Iniciando sesión…' : 'Iniciar sesión'} disabled={cargando} onPress={() => void ingresar()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
    },
    contenido: {
      ...Visual.content,
      maxWidth: 440,
      paddingTop: 32,
      paddingBottom: 32,
      backgroundColor: theme.background,
    },
    campo: {
      padding: Spacing.two,
      ...Visual.input,
      color: theme.text,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
  });
