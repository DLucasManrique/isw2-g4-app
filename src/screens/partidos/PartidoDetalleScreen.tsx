import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Visual } from '@/constants/theme';
import { type Equipo, obtenerEquipo } from '@/services/equiposService';
import { type Partido, obtenerPartido } from '@/services/partidosService';

export default function PartidoDetalleScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const partidoId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const idValido = Number.isSafeInteger(partidoId) && partidoId > 0 && partidoId <= 2147483647;
  const [partido, setPartido] = useState<Partido | null>(null);
  const [local, setLocal] = useState<Equipo | null>(null);
  const [visitante, setVisitante] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useFocusEffect(useCallback(() => {
    let vigente = true;
    setPartido(null);
    setLocal(null);
    setVisitante(null);
    setError('');
    setCargando(true);

    async function cargar() {
      try {
        if (!idValido) return;
        const datos = await obtenerPartido(partidoId);
        if (!vigente) return;
        if (datos) {
          const [equipoLocal, equipoVisitante] = await Promise.all([
            obtenerEquipo(datos.equipoLocalId).catch(() => null),
            obtenerEquipo(datos.equipoVisitanteId).catch(() => null),
          ]);
          if (!vigente) return;
          setPartido(datos);
          setLocal(equipoLocal);
          setVisitante(equipoVisitante);
        }
      } catch (error) {
        if (vigente) setError(error instanceof Error ? error.message : 'No se pudo cargar el partido.');
      } finally {
        if (vigente) setCargando(false);
      }
    }

    void cargar();
    return () => { vigente = false; };
  }, [partidoId, idValido, intento]));

  const [fecha, hora] = partido?.fechaHoraInicio?.split('T') ?? [];

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <ScrollView contentContainerStyle={styles.contenido}>
          {!idValido ? (
            <ThemedText accessibilityRole="alert">El ID del partido debe ser un entero positivo válido.</ThemedText>
          ) : cargando ? (
            <>
              <ActivityIndicator accessibilityLabel="Cargando partido" />
              <ThemedText>Cargando partido…</ThemedText>
            </>
          ) : error ? (
            <>
              <ThemedText accessibilityRole="alert">{error}</ThemedText>
              <Button variant="secondary" title="Reintentar" onPress={() => setIntento((valor) => valor + 1)} />
            </>
          ) : !partido ? (
            <ThemedText>El partido no existe.</ThemedText>
          ) : (
            <>
              <ThemedText type="subtitle">Local: {local?.nombre || `Equipo ${partido.equipoLocalId}`}</ThemedText>
              <ThemedText>Goles local: {partido.golesLocal}</ThemedText>
              <ThemedText type="subtitle">Visitante: {visitante?.nombre || `Equipo ${partido.equipoVisitanteId}`}</ThemedText>
              <ThemedText>Goles visitante: {partido.golesVisitante}</ThemedText>
              <ThemedText>Número de fecha: {partido.numeroFecha}</ThemedText>
              <ThemedText>Estado: {partido.estado}</ThemedText>
              <ThemedText>Fecha: {fecha ? fecha.split('-').reverse().join('/') : 'No disponible'}</ThemedText>
              <ThemedText>Hora: {hora?.slice(0, 5) || 'No disponible'}</ThemedText>
              <Button variant="secondary" title="Abrir partido en vivo" onPress={() => router.push({ pathname: '/partidos/[id]', params: { id: partido.id } })} />
            </>
          )}
          <Button variant="secondary" title="Volver al listado" onPress={() => router.dismissTo('/partidos')} />
        </ScrollView>
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
      backgroundColor: theme.background,
    },
  });
