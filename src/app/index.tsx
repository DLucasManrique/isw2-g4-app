import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Visual } from '@/constants/theme';
import { useSesion } from '@/contexts/SesionContext';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const { usuario, cerrarSesion } = useSesion();
  const esAdmin = usuario?.rol === 'ADMIN';
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState('');
  const theme = useTheme();
  const { width } = useWindowDimensions();
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SafeAreaView style={styles.content}>
          <View style={styles.heading}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>FÚTBOL DE SANTA FE</ThemedText>
            <ThemedText type="title">Liga Amateur Santafesina</ThemedText>
            <ThemedText themeColor="textSecondary">Gestión y seguimiento de nuestra liga.</ThemedText>
          </View>
          <AppCard>
            <ThemedText type="smallBold">{usuario?.nombreCompleto}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Rol: {usuario?.rol}</ThemedText>
            <AppButton variant="secondary" title={cerrando ? 'Cerrando sesión…' : 'Cerrar sesión'} disabled={cerrando} onPress={() => void salir()} />
            {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
          </AppCard>
          <ThemedText type="subtitle">Explorá la liga</ThemedText>
          <View style={styles.grid}>
            {[
              { title: 'Equipos', description: 'Gestión de equipos de la liga', route: '/equipos' as const },
              { title: 'Jugadores', description: 'Planteles y datos de jugadores', route: '/jugadores' as const },
              { title: 'Catálogo', description: 'Torneos, canchas y árbitros', route: '/catalogo' as const },
              { title: 'Partidos', description: 'Programación, resultados y seguimiento', route: '/partidos' as const },
              { title: 'Tabla de posiciones', description: 'Clasificación por torneo', route: '/posiciones' as const },
              { title: 'Suspendidos', description: 'Consulta de jugadores suspendidos', route: '/suspendidos' as const },
              ...(esAdmin ? [{ title: 'Gestión de usuarios', description: 'Administración de usuarios', route: '/usuarios' as const }] : []),
            ].map((item) => (
              <AppCard key={item.route} style={[styles.access, { width: width >= 600 ? '48%' : '100%' }]} accessibilityLabel={item.title} onPress={() => router.push(item.route)}>
                <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 18 }}>{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.description}</ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>Ingresar →</ThemedText>
              </AppCard>
            ))}
          </View>
          <AppCard>
            <ThemedText type="smallBold">Acceso directo por ID</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Si conocés el ID, podés abrir directamente el partido en vivo.</ThemedText>
            <ThemedText type="small">ID del partido</ThemedText>
            <TextInput accessibilityLabel="ID del partido" value={partidoId} onChangeText={setPartidoId} keyboardType="number-pad" placeholder="ID del partido" placeholderTextColor={theme.textSecondary} style={[Visual.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]} onSubmitEditing={abrirPartido} />
            {!!errorPartido && <ThemedText accessibilityRole="alert">{errorPartido}</ThemedText>}
            <AppButton variant="secondary" title="Abrir partido" onPress={abrirPartido} />
          </AppCard>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: { ...Visual.content, paddingBottom: 32 },
  heading: { gap: 8, paddingVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  access: { minHeight: 144, justifyContent: 'space-between' },
});
