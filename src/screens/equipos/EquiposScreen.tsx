import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Visual } from '@/constants/theme';
import { type Equipo, listarEquipos } from '@/services/equiposService';
import { useSesion } from '@/contexts/SesionContext';

export default function EquiposScreen() {
  const { usuario } = useSesion();
  const theme = useTheme();
  const styles = createStyles(theme);
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
        {usuario?.rol === 'ADMIN' && <Button title="Nuevo equipo" onPress={() => router.push('/equipos/nuevo')} />}
        {cargando ? (
          <ThemedView style={styles.mensaje}>
            <ActivityIndicator accessibilityLabel="Cargando equipos" />
            <ThemedText>Cargando equipos…</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.mensaje}>
            <ThemedText accessibilityRole="alert">{error}</ThemedText>
            <Button variant="secondary" title="Reintentar" onPress={() => void cargarEquipos()} />
          </ThemedView>
        ) : (
          <FlatList
            data={equipos}
            keyExtractor={(equipo) => String(equipo.id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={<ThemedText style={[Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay equipos registrados.</ThemedText>}
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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    pantalla: {
      flex: 1,
    },
    contenido: {
      flex: 1,
      ...Visual.content,
      backgroundColor: theme.background,
    },
    lista: {
      gap: Spacing.two,
      paddingBottom: Spacing.three,
    },
    equipo: {
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    mensaje: {
      paddingVertical: Spacing.three,
      gap: Spacing.two,
    },
  });
