import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { type Equipo, listarEquipos } from '@/services/equiposService';
import { type Partido, listarPartidos } from '@/services/partidosService';

export default function PartidosScreen() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useFocusEffect(useCallback(() => {
    let vigente = true;
    setCargando(true);
    setError('');

    async function cargar() {
      try {
        const [lista, nombres] = await Promise.all([
          listarPartidos(),
          listarEquipos().catch(() => [] as Equipo[]),
        ]);
        if (vigente) {
          setPartidos(lista);
          setEquipos(nombres);
        }
      } catch (error) {
        if (vigente) setError(error instanceof Error ? error.message : 'No se pudieron cargar los partidos.');
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();
    return () => { vigente = false; };
  }, [intento]));

  function nombreEquipo(id: number) {
    return equipos.find((equipo) => equipo.id === id)?.nombre || `Equipo ${id}`;
  }

  function fechaHora(valor: string | null) {
    if (!valor) return 'Fecha y hora no disponibles';
    const [fecha, hora] = valor.split('T');
    return `${fecha.split('-').reverse().join('/')} - ${hora?.slice(0, 5) || 'Hora no disponible'}`;
  }

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.contenido}>
        <Button title="Programar partido" onPress={() => router.push('/partidos/nuevo')} />
        {cargando ? (
          <ThemedView style={styles.mensaje}>
            <ActivityIndicator accessibilityLabel="Cargando partidos" />
            <ThemedText>Cargando partidos…</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.mensaje}>
            <ThemedText accessibilityRole="alert">{error}</ThemedText>
            <Button title="Reintentar" onPress={() => setIntento((valor) => valor + 1)} />
          </ThemedView>
        ) : (
          <FlatList
            data={partidos}
            keyExtractor={(partido) => String(partido.id)}
            contentContainerStyle={styles.lista}
            ListEmptyComponent={<ThemedText>No hay partidos disponibles.</ThemedText>}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver detalle de ${nombreEquipo(item.equipoLocalId)} contra ${nombreEquipo(item.equipoVisitanteId)}`}
                onPress={() => router.push({ pathname: '/partidos/[id]/detalle', params: { id: item.id } })}>
                <ThemedView type="backgroundElement" style={styles.partido}>
                  <ThemedText type="smallBold">Fecha {item.numeroFecha}</ThemedText>
                  <ThemedText>Local: {nombreEquipo(item.equipoLocalId)}</ThemedText>
                  <ThemedText type="subtitle">{item.golesLocal} - {item.golesVisitante}</ThemedText>
                  <ThemedText>Visitante: {nombreEquipo(item.equipoVisitanteId)}</ThemedText>
                  <ThemedText>Estado: {item.estado}</ThemedText>
                  <ThemedText>{fechaHora(item.fechaHoraInicio)}</ThemedText>
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
  },
  lista: { gap: Spacing.two, paddingBottom: Spacing.three },
  partido: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.one },
  mensaje: { paddingVertical: Spacing.three, gap: Spacing.two },
});
