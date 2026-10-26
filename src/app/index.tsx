import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSesion } from '@/contexts/SesionContext';
import { useTheme } from '@/hooks/use-theme';

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const { usuario, cerrarSesion } = useSesion();
  const esAdmin = usuario?.rol === 'ADMIN';
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const [partidoId, setPartidoId] = useState('');
  const [errorPartido, setErrorPartido] = useState('');

  async function salir() {
    if (cerrando) return;
    setCerrando(true);
    setError('');
    try {
      await cerrarSesion();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.');
    } finally {
      setCerrando(false);
    }
  }

  function abrirPartido() {
    const id = Number(partidoId.trim());
    if (!/^\d+$/.test(partidoId.trim()) || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
      setErrorPartido('Ingresa un ID de partido entero positivo válido.');
      return;
    }
    setErrorPartido('');
    router.push({ pathname: '/partidos/[id]', params: { id } });
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.desplazable} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>{usuario?.nombreCompleto}</ThemedText>
          <Button title={cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={cerrando} onPress={() => void salir()} />
          {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
          <ThemedView style={styles.heroSection}>
            <AnimatedIcon />
            <ThemedText type="title" style={styles.title}>
              Welcome to&nbsp;Expo
            </ThemedText>
          </ThemedView>

          <Button title="Gestión de equipos" onPress={() => router.push('/equipos')} />
          <Button title="Partidos" onPress={() => router.push('/partidos')} />
          {esAdmin && (
  <Button
    title="Gestión de usuarios"
    onPress={() => router.push('/usuarios')}
  />
)}
          <Button
  title="Tabla de posiciones"
  onPress={() => router.push('/posiciones')}
/>
          <ThemedView style={styles.accesoPartido}>
            <ThemedText>ID del partido</ThemedText>
            <TextInput accessibilityLabel="ID del partido" value={partidoId} onChangeText={setPartidoId} keyboardType="number-pad" style={{ color: theme.text, borderColor: theme.textSecondary, borderWidth: 1, borderRadius: Spacing.one, padding: Spacing.two, minHeight: 48 }} onSubmitEditing={abrirPartido} />
            {!!errorPartido && <ThemedText accessibilityRole="alert">{errorPartido}</ThemedText>}
            <Button title="Abrir partido" onPress={abrirPartido} />
          </ThemedView>

          <ThemedText type="code" style={styles.code}>
            get started
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <HintRow
              title="Try editing"
              hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
            />
            <HintRow title="Dev tools" hint={getDevMenuHint()} />
            <HintRow
              title="Fresh start"
              hint={<ThemedText type="code">npm run reset-project</ThemedText>}
            />
          </ThemedView>

          {Platform.OS === 'web' && <WebBadge />}
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  accesoPartido: { alignSelf: 'stretch', gap: Spacing.one },
  desplazable: { flexGrow: 1, alignItems: 'center' },
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});
