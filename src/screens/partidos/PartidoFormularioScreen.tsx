import { AppButton as Button } from '@/components/app-button';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getArbitros, getCanchas, getTorneos, type Arbitro, type Cancha } from '@/services/catalogoService';
import { listarEquipos, type Equipo } from '@/services/equiposService';
import { crearPartido } from '@/services/partidosService';
import { useSesion } from '@/contexts/SesionContext';

export default function PartidoFormularioScreen() {
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === 'ADMIN';
  const theme = useTheme();
  const styles = createStyles(theme);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [arbitros, setArbitros] = useState<Arbitro[]>([]);
  const [equipoLocalId, setEquipoLocalId] = useState<number | null>(null);
  const [equipoVisitanteId, setEquipoVisitanteId] = useState<number | null>(null);
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [arbitroId, setArbitroId] = useState<number | null>(null);
  const [numeroFecha, setNumeroFecha] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!esAdmin) return;
    let vigente = true;
    setCargando(true);
    setErrorCarga('');
    async function cargar() {
      try {
        const [listaTorneos, listaEquipos, listaCanchas, listaArbitros] = await Promise.all([
          getTorneos(), listarEquipos(), getCanchas(), getArbitros(),
        ]);
        if (!vigente) return;
        const torneos2026 = listaTorneos.filter((item) => item.anio === 2026);
        if (torneos2026.length !== 1) throw new Error('Debe existir exactamente un torneo correspondiente a 2026.');
        setEquipos(listaEquipos.filter((item) => item.activo && item.torneoId === torneos2026[0].id));
        setCanchas(listaCanchas.filter((item) => item.activo));
        setArbitros(listaArbitros.filter((item) => item.activo));
      } catch (error) {
        if (vigente) setErrorCarga(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
      } finally {
        if (vigente) setCargando(false);
      }
    }
    void cargar();
    return () => { vigente = false; };
  }, [esAdmin, intento]);

  async function guardar() {
    if (!esAdmin || guardando || cargando || errorCarga) return;
    setError('');
    if (equipoLocalId === null || equipoVisitanteId === null || canchaId === null || arbitroId === null) {
      setError('Seleccioná ambos equipos, cancha y árbitro.');
      return;
    }
    if (equipoLocalId === equipoVisitanteId) {
      setError('El equipo local y el visitante deben ser diferentes.');
      return;
    }
    const numero = Number(numeroFecha.trim());
    if (!/^\d+$/.test(numeroFecha.trim()) || !Number.isInteger(numero) || numero < 1 || numero > 2147483647) {
      setError('El número de fecha debe ser un entero positivo válido.');
      return;
    }
    const fechaTexto = fecha.trim();
    const horaTexto = hora.trim();
    const [anio, mes, dia] = fechaTexto.split('-').map(Number);
    const [horas, minutos] = horaTexto.split(':').map(Number);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaTexto) || anio < 1 || mes < 1 || mes > 12 || dia < 1 ||
        dia > new Date(Date.UTC(anio, mes, 0)).getUTCDate() ||
        !/^\d{2}:\d{2}$/.test(horaTexto) || horas > 23 || minutos > 59) {
      setError('Ingresá una fecha válida (AAAA-MM-DD) y hora válida (HH:mm).');
      return;
    }
    setGuardando(true);
    try {
      await crearPartido({
        numeroFecha: numero, equipoLocalId, equipoVisitanteId,
        canchaId, arbitroId, fechaHoraInicio: `${fechaTexto}T${horaTexto}:00`,
      });
      router.dismissTo('/partidos');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo programar el partido.');
    } finally {
      setGuardando(false);
    }
  }

  function selector(titulo: string, opciones: { id: number; nombre: string }[], seleccionado: number | null, seleccionar: (id: number) => void) {
    return (
      <ThemedView style={styles.selector}>
        <ThemedText type="smallBold">{titulo}</ThemedText>
        {opciones.length === 0 && <ThemedText style={[Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay opciones disponibles.</ThemedText>}
        {opciones.map((item) => (
          <Button selected={seleccionado === item.id} key={item.id} title={`${seleccionado === item.id ? '✓ ' : ''}${item.nombre}`} disabled={guardando} onPress={() => seleccionar(item.id)} />
        ))}
      </ThemedView>
    );
  }

  const estiloCampo = [styles.campo, { color: theme.text, borderColor: theme.border }];

  if (!esAdmin) return <Redirect href="/partidos" />;

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          {cargando ? <ActivityIndicator accessibilityLabel="Cargando opciones del partido" /> : errorCarga ? (
            <>
              <ThemedText accessibilityRole="alert">{errorCarga}</ThemedText>
              <Button variant="secondary" title="Reintentar" onPress={() => setIntento((valor) => valor + 1)} />
            </>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">Torneo 2026</ThemedText>
              {selector('Equipo local', equipos, equipoLocalId, setEquipoLocalId)}
              {selector('Equipo visitante', equipos.filter((item) => item.id !== equipoLocalId), equipoVisitanteId, setEquipoVisitanteId)}
              {selector('Cancha', canchas, canchaId, setCanchaId)}
              {selector('Árbitro', arbitros.map((item) => ({ id: item.id, nombre: `${item.nombre} ${item.apellido}` })), arbitroId, setArbitroId)}
              <ThemedText>Número de fecha</ThemedText>
              <TextInput accessibilityLabel="Número de fecha" value={numeroFecha} onChangeText={setNumeroFecha} keyboardType="number-pad" editable={!guardando} style={estiloCampo} />
              <ThemedText>Fecha (AAAA-MM-DD)</ThemedText>
              <TextInput accessibilityLabel="Fecha del partido" value={fecha} onChangeText={setFecha} placeholder="2026-11-15" editable={!guardando} style={estiloCampo} />
              <ThemedText>Hora local (HH:mm)</ThemedText>
              <TextInput accessibilityLabel="Hora del partido" value={hora} onChangeText={setHora} placeholder="16:30" editable={!guardando} style={estiloCampo} />
              {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
              <Button title={guardando ? 'Guardando…' : 'Programar partido'} disabled={guardando} onPress={() => void guardar()} />
            </>
          )}
          <Button variant="secondary" title="Cancelar" disabled={guardando} onPress={() => router.dismissTo('/partidos')} />
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
    selector: {
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    campo: {
      padding: Spacing.two,
      ...Visual.input,
      color: theme.text,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
  });
