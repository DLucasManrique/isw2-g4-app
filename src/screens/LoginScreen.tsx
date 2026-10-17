import { useState } from 'react';
import { ActivityIndicator, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/contexts/SesionContext';
import { useTheme } from '@/hooks/use-theme';
import { iniciarSesion } from '@/services/authService';

export default function LoginScreen() {
  const theme = useTheme();
  const { guardarSesion, error: errorSesion } = useSesion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const estiloCampo = [styles.campo, { color: theme.text, borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            <ThemedText type="title">Inicio de sesión</ThemedText>
            <ThemedText>Usuario</ThemedText>
            <TextInput accessibilityLabel="Usuario" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!cargando} style={estiloCampo} />
            <ThemedText>Contraseña</ThemedText>
            <TextInput accessibilityLabel="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!cargando} style={estiloCampo} onSubmitEditing={() => void ingresar()} />
            {!!(error || errorSesion) && <ThemedText accessibilityRole="alert">{error || errorSesion}</ThemedText>}
            {cargando && <ActivityIndicator accessibilityLabel="Iniciando sesión" />}
            <Button title={cargando ? 'Iniciando sesión…' : 'Iniciar sesión'} disabled={cargando} onPress={() => void ingresar()} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, gap: Spacing.two },
  campo: { borderWidth: 1, borderRadius: Spacing.one, padding: Spacing.two, fontSize: 16, minHeight: 48 },
});
