import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { actualizarEquipo, crearEquipo, obtenerEquipo } from '@/services/equiposService';

export default function EquipoFormularioScreen({ modo }: { modo: 'crear' | 'editar' }) {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const equipoId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const idValido = Number.isSafeInteger(equipoId) && equipoId > 0 && equipoId <= 2147483647;
  const editando = modo === 'editar';
  const theme = useTheme();
  const [nombre, setNombre] = useState('');
  const [barrio, setBarrio] = useState('');
  const [torneoId, setTorneoId] = useState('');
  const [cargando, setCargando] = useState(editando);
  const [equipoCargado, setEquipoCargado] = useState(!editando);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    if (!editando) return;
    if (!idValido) {
      setError('El ID del equipo debe ser un entero positivo válido.');
      setEquipoCargado(false);
      setCargando(false);
      return;
    }
    let vigente = true;
    setCargando(true);
    setEquipoCargado(false);
    setError('');
    obtenerEquipo(equipoId)
      .then((equipo) => {
        if (!vigente) return;
        setNombre(equipo.nombre);
        setBarrio(equipo.barrio ?? '');
        setTorneoId(String(equipo.torneoId));
        setEquipoCargado(true);
      })
      .catch((error: unknown) => {
        if (vigente) setError(error instanceof Error ? error.message : 'No se pudo cargar el equipo.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [editando, equipoId, idValido, intentoCarga]);

  async function guardar() {
    if (guardando || cargando || !equipoCargado || (editando && !idValido)) return;
    const numeroTorneo = Number(torneoId.trim());
    if (!nombre.trim()) {
      setError('El nombre es obligatorio y no puede contener solamente espacios.');
      return;
    }
    if (nombre.length > 80 || barrio.length > 80) {
      setError('El nombre y el barrio deben tener como máximo 80 caracteres.');
      return;
    }
    if (
      !/^\d+$/.test(torneoId.trim()) ||
      !Number.isInteger(numeroTorneo) ||
      numeroTorneo <= 0 ||
      numeroTorneo > 2147483647
    ) {
      setError('El ID del torneo debe ser un entero positivo válido.');
      return;
    }
    setGuardando(true);
    setError('');
    const datos = {
      torneoId: numeroTorneo,
      nombre: nombre.trim(),
      barrio: barrio === '' ? null : barrio,
    };
    try {
      if (editando) {
        await actualizarEquipo(equipoId, datos);
        router.dismissTo({ pathname: '/equipos/[id]', params: { id: equipoId } });
      } else {
        await crearEquipo(datos);
        router.dismissTo('/equipos');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo guardar el equipo.');
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    if (editando && idValido) {
      router.dismissTo({ pathname: '/equipos/[id]', params: { id: equipoId } });
    } else {
      router.dismissTo('/equipos');
    }
  }

  const estiloCampo = [
    styles.campo,
    {
      color: theme.text,
      borderColor: theme.textSecondary,
      backgroundColor: theme.backgroundElement,
    },
  ];

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            {cargando && <ActivityIndicator accessibilityLabel="Cargando equipo" />}
            {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
            {!cargando && !equipoCargado && idValido && (
              <Button title="Reintentar" onPress={() => setIntentoCarga((intento) => intento + 1)} />
            )}
            {!cargando && equipoCargado && (
              <>
                <ThemedText>Nombre (obligatorio)</ThemedText>
                <TextInput
                  accessibilityLabel="Nombre del equipo, obligatorio"
                  value={nombre}
                  onChangeText={setNombre}
                  maxLength={80}
                  editable={!guardando}
                  style={estiloCampo}
                />
                <ThemedText>Barrio (opcional)</ThemedText>
                <TextInput
                  accessibilityLabel="Barrio, opcional"
                  value={barrio}
                  onChangeText={setBarrio}
                  maxLength={80}
                  editable={!guardando}
                  style={estiloCampo}
                />
                <ThemedText>ID del torneo (obligatorio)</ThemedText>
                <TextInput
                  accessibilityLabel="ID del torneo, obligatorio"
                  value={torneoId}
                  onChangeText={setTorneoId}
                  keyboardType="number-pad"
                  editable={!guardando}
                  style={estiloCampo}
                />
                <ThemedText type="small" themeColor="textSecondary">Debe corresponder a un torneo existente.</ThemedText>
                <Button title={guardando ? 'Guardando…' : 'Guardar equipo'} disabled={guardando} onPress={() => void guardar()} />
              </>
            )}
            <Button title="Cancelar" disabled={guardando} onPress={cancelar} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  contenido: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  campo: { borderWidth: 1, borderRadius: Spacing.one, padding: Spacing.two, fontSize: 16, minHeight: 48 },
});
