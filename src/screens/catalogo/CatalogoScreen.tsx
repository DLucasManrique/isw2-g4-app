import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { getArbitros, getCanchas, getTorneos } from '../../services/catalogoService';

export default function CatalogoScreen() {
  const [seccion, setSeccion] = useState<'torneos' | 'canchas' | 'arbitros'>('torneos');
  const [datos, setDatos] = useState<any[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [seccion]);

  const cargarDatos = async () => {
    if (seccion === 'torneos') {
      const res = await getTorneos();
      setDatos(res);
    } else if (seccion === 'canchas') {
      const res = await getCanchas();
      setDatos(res);
    } else if (seccion === 'arbitros') {
      const res = await getArbitros();
      setDatos(res);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.botones}>
        <Button title="Torneos" onPress={() => setSeccion('torneos')} />
        <Button title="Canchas" onPress={() => setSeccion('canchas')} />
        <Button title="Árbitros" onPress={() => setSeccion('arbitros')} />
      </View>

      <FlatList
        data={datos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.texto}>
              {item.nombre || item.denominacion || item.nombreCompleto || JSON.stringify(item)}
            </Text>
          </View>
        )}
      />
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