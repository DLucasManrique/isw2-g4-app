import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { type Equipo, listarEquipos } from '@/services/equiposService';

export default function EquiposScreen() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarEquipos = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setEquipos(await listarEquipos());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar los equipos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarEquipos();
    }, [cargarEquipos])
  );

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.contenido}>
        <Button title="Nuevo equipo" onPress={() => router.push('/equipos/nuevo')} />
        {cargando ? (
          <ThemedView style={styles.mensaje}>
            <ActivityIndicator accessibilityLabel="Cargando equipos" />
            <ThemedText>Cargando equipos…</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.mensaje}>
            <ThemedText accessibilityRole="alert">{error}</ThemedText>
            <Button title="Reintentar" onPress={() => void cargarEquipos()} />
          </ThemedView>
        ) : (
          <FlatList
            data={equipos}
            keyExtractor={(equipo) => String(equipo.id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={<ThemedText>No hay equipos registrados.</ThemedText>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Consultar ${item.nombre}, ${item.activo ? 'activo' : 'inactivo'}`}
                onPress={() => router.push({ pathname: '/equipos/[id]', params: { id: item.id } })}>
                <ThemedView type="backgroundElement" style={styles.equipo}>
                  <ThemedText type="smallBold">{item.nombre}</ThemedText>
                  <ThemedText>Barrio: {item.barrio || 'Sin especificar'}</ThemedText>
                  <ThemedText>Torneo: {item.torneoId}</ThemedText>
                  <ThemedText type="smallBold">Estado: {item.activo ? 'Activo' : 'Inactivo'}</ThemedText>
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  lista: { gap: Spacing.two, paddingBottom: Spacing.three },
  equipo: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  mensaje: { paddingVertical: Spacing.three, gap: Spacing.two },
});
