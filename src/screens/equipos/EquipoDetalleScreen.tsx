import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Visual } from '@/constants/theme';
import { darDeBajaEquipo, type Equipo, obtenerEquipo } from '@/services/equiposService';

export default function EquipoDetalleScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const equipoId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const idValido = Number.isSafeInteger(equipoId) && equipoId > 0 && equipoId <= 2147483647;
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargarEquipo = useCallback(async () => {
    setError('');
    setEquipo(null);
    setConfirmando(false);
    if (!idValido) {
      setError('El ID del equipo debe ser un entero positivo válido.');
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      setEquipo(await obtenerEquipo(equipoId));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo cargar el equipo.');
    } finally {
      setCargando(false);
    }
  }, [equipoId, idValido]);

  useFocusEffect(
    useCallback(() => {
      void cargarEquipo();
    }, [cargarEquipo])
  );

  async function confirmarBaja() {
    if (procesando || !equipo || !equipo.activo || !idValido) return;
    setProcesando(true);
    setError('');
    try {
      await darDeBajaEquipo(equipoId);
      router.dismissTo('/equipos');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo dar de baja el equipo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <ScrollView contentContainerStyle={styles.contenido}>
          {cargando && <ActivityIndicator accessibilityLabel="Cargando equipo" />}
          {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
          {!cargando && !equipo && idValido && (
            <Button variant="secondary" title="Reintentar" onPress={() => void cargarEquipo()} />
          )}
          {!cargando && equipo && (
            <>
              <ThemedText type="subtitle">{equipo.nombre}</ThemedText>
              <ThemedText>ID: {equipo.id}</ThemedText>
              <ThemedText>Torneo: {equipo.torneoId}</ThemedText>
              <ThemedText>Barrio: {equipo.barrio || 'Sin especificar'}</ThemedText>
              <ThemedText type="smallBold">Estado: {equipo.activo ? 'Activo' : 'Inactivo'}</ThemedText>
              <Button variant="secondary"
                title="Editar equipo"
                disabled={procesando}
                onPress={() => router.push({ pathname: '/equipos/[id]/editar', params: { id: equipo.id } })}
              />
              {equipo.activo && !confirmando && (
                <Button variant="danger" title="Dar de baja" onPress={() => setConfirmando(true)} />
              )}
              {confirmando && (
                <ThemedView type="backgroundElement" style={styles.confirmacion}>
                  <ThemedText>¿Dar de baja a “{equipo.nombre}”? El equipo quedará inactivo.</ThemedText>
                  <Button variant="secondary" title="Cancelar" disabled={procesando} onPress={() => setConfirmando(false)} />
                  <Button variant="danger"
                    title={procesando ? 'Dando de baja…' : 'Confirmar baja'}
                    disabled={procesando}
                    onPress={() => void confirmarBaja()}
                  />
                </ThemedView>
              )}
            </>
          )}
          <Button variant="secondary" title="Volver al listado" disabled={procesando} onPress={() => router.dismissTo('/equipos')} />
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
    confirmacion: {
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
  });
