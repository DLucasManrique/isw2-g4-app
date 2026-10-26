import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { getArbitros, getCanchas, getTorneos, type Arbitro, type Cancha, type Torneo } from '../../services/catalogoService';

export default function CatalogoScreen() {
  const [seccion, setSeccion] = useState<'torneos' | 'canchas' | 'arbitros'>('torneos');
  const [datos, setDatos] = useState<(Torneo | Cancha | Arbitro)[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    setDatos([]);
    async function cargarDatos() {
      try {
        const res = await (seccion === 'torneos' ? getTorneos() : seccion === 'canchas' ? getCanchas() : getArbitros());
        if (vigente) setDatos(res);
      } catch (error) {
        if (vigente) setError(error instanceof Error ? error.message : 'No se pudo cargar el catálogo.');
      } finally {
        if (vigente) setCargando(false);
      }
    }
    void cargarDatos();
    return () => { vigente = false; };
  }, [seccion, intento]);

  return (
    <View style={styles.container}>
      <View style={styles.botones}>
        <Button title="Torneos" onPress={() => setSeccion('torneos')} />
        <Button title="Canchas" onPress={() => setSeccion('canchas')} />
        <Button title="Árbitros" onPress={() => setSeccion('arbitros')} />
      </View>

      {cargando ? <ActivityIndicator /> : error ? (
        <View>
          <Text accessibilityRole="alert">{error}</Text>
          <Button title="Reintentar" onPress={() => setIntento((valor) => valor + 1)} />
        </View>
      ) : <FlatList
        data={datos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.texto}>
              {'apellido' in item ? `${item.nombre} ${item.apellido}` : item.nombre}
            </Text>
          </View>
        )}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  botones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  card: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  texto: {
    fontSize: 16,
  },
});
