import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/app-button';
import { JugadorSuspendido, suspendidosService } from '../../services/suspendidosService';

export default function SuspendidosScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [suspendidos, setSuspendidos] = useState<JugadorSuspendido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await suspendidosService.obtenerSuspendidos();
      setSuspendidos(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar los suspendidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jugadores Suspendidos</Text>
        <AppButton variant="secondary" title="Actualizar" onPress={cargarDatos} disabled={loading} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : error ? (
        <Text style={styles.error} accessibilityRole="alert">{error}</Text>
      ) : suspendidos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay jugadores suspendidos.</Text>
        </View>
      ) : (
        <FlatList
          data={suspendidos}
          keyExtractor={(item) => `${item.partidoId}-${item.jugadorId}`}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.nombre} {item.apellido}</Text>
              <Text style={styles.cardSub}>Equipo: {item.equipoNombre}</Text>
              <Text style={styles.motivo}>Motivo: {item.motivo}</Text>
              <Text style={styles.cardSub}>Partido: {item.partidoId}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      ...Visual.content,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: theme.text,
      ...Visual.title,
    },
    emptyCard: {
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    emptyText: {
      textAlign: 'center',
      color: theme.textSecondary,
    },
    card: {
      marginBottom: 12,
      elevation: 2,
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    cardSub: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    motivo: {
      fontSize: 14,
      color: theme.danger,
      fontWeight: 'bold',
      marginTop: 4,
    },
    error: {
      ...Visual.message,
      color: theme.danger,
      backgroundColor: theme.dangerBackground,
    },
  });
