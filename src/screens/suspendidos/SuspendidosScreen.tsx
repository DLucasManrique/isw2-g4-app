import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { JugadorSuspendido, suspendidosService } from '../../services/suspendidosService';

export default function SuspendidosScreen() {
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
        <TouchableOpacity style={styles.button} onPress={cargarDatos} disabled={loading}>
          <Text style={styles.buttonText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : error ? (
        <Text accessibilityRole="alert">{error}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyCard: {
    padding: 16,
    backgroundColor: '#e2e3e5',
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#383d41',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSub: {
    fontSize: 14,
    color: '#555',
  },
  motivo: {
    fontSize: 14,
    color: '#d9534f',
    fontWeight: 'bold',
    marginTop: 4,
  },
});
