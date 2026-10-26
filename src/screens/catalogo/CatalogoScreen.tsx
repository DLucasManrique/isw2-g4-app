import { Visual } from '@/constants/theme';
import { AppButton as Button } from '@/components/app-button';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { getArbitros, getCanchas, getTorneos, type Arbitro, type Cancha, type Torneo } from '../../services/catalogoService';

export default function CatalogoScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.botones}>
        <Button selected={seccion === 'torneos'} title="Torneos" onPress={() => setSeccion('torneos')} />
        <Button selected={seccion === 'canchas'} title="Canchas" onPress={() => setSeccion('canchas')} />
        <Button selected={seccion === 'arbitros'} title="Árbitros" onPress={() => setSeccion('arbitros')} />
      </View>

      {cargando ? <ActivityIndicator /> : error ? (
        <View>
          <Text style={[Visual.message, { color: theme.danger, backgroundColor: theme.dangerBackground }]} accessibilityRole="alert">{error}</Text>
          <Button variant="secondary" title="Reintentar" onPress={() => setIntento((valor) => valor + 1)} />
        </View>
      ) : <FlatList
        data={datos}
        contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={[styles.texto, { color: theme.text }]}>
              {'apellido' in item ? `${item.nombre} ${item.apellido}` : item.nombre}
            </Text>
          </View>
        )}
      />}
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
    botones: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    card: {
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    texto: {
      fontSize: 16,
      lineHeight: 24,
    },
  });
