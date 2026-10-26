import { AppButton as Button } from '@/components/app-button';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { obtenerEquipo, type Equipo } from '@/services/equiposService';
import { corregirEvento, eliminarEvento, listarEventos, registrarEvento, type EventoPartido, type TipoEvento } from '@/services/eventosPartidoService';
import { listarJugadoresPorEquipo, type Jugador } from '@/services/jugadoresService';
import { cambiarEstadoPartido, obtenerPartido, type EstadoPartido, type Partido } from '@/services/partidosService';

export default function PartidoEnVivoScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const partidoId = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : NaN;
  const idValido = Number.isSafeInteger(partidoId) && partidoId > 0 && partidoId <= 2147483647;
  const theme = useTheme();
  const styles = createStyles(theme);
  const [partido, setPartido] = useState<Partido | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [eventos, setEventos] = useState<EventoPartido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [actualizado, setActualizado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [jugadorId, setJugadorId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoEvento | null>(null);
  const [minuto, setMinuto] = useState('');
  const [editando, setEditando] = useState<number | null>(null);
  const [mostrarJugadores, setMostrarJugadores] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ estado: EstadoPartido } | { eventoId: number } | null>(null);
  const ocupado = useRef(false);
  const vigente = useRef(0);

  function limpiarFormulario() {
    setJugadorId(null);
    setTipo(null);
    setMinuto('');
    setEditando(null);
    setMostrarJugadores(false);
  }

  const cargarDatos = useCallback(async (version: number) => {
    const datos = await obtenerPartido(partidoId);
    if (!datos) throw new Error('El partido no existe.');
    const [local, visitante, jugadoresLocal, jugadoresVisitante, lista] = await Promise.all([
      obtenerEquipo(datos.equipoLocalId),
      obtenerEquipo(datos.equipoVisitanteId),
      listarJugadoresPorEquipo(datos.equipoLocalId),
      listarJugadoresPorEquipo(datos.equipoVisitanteId),
      listarEventos(partidoId),
    ]);
    if (vigente.current !== version) return;
    setPartido(datos);
    setEquipos([local, visitante]);
    setJugadores([...jugadoresLocal, ...jugadoresVisitante]);
    setEventos([...lista].sort((a, b) => a.minuto - b.minuto || a.id - b.id));
    setActualizado(true);
  }, [partidoId]);

  const actualizar = useCallback(async () => {
    if (ocupado.current) return;
    const version = vigente.current;
    ocupado.current = true;
    setCargando(true);
    setActualizado(false);
    setError('');
    setMensaje('');
    setConfirmacion(null);
    limpiarFormulario();
    try {
      if (!idValido) throw new Error('El ID del partido debe ser un entero positivo válido.');
      await cargarDatos(version);
    } catch (error) {
      if (vigente.current === version) setError(error instanceof Error ? error.message : 'No se pudo cargar el partido.');
    } finally {
      if (vigente.current === version) {
        ocupado.current = false;
        setCargando(false);
      }
    }
  }, [cargarDatos, idValido]);

  useFocusEffect(useCallback(() => {
    vigente.current++;
    ocupado.current = false;
    setPartido(null);
    setEquipos([]);
    setJugadores([]);
    setEventos([]);
    setProcesando(false);
    void actualizar();
    return () => {
      vigente.current++;
    };
  }, [actualizar]));

  const bloqueado = cargando || procesando || !actualizado;
  const enJuego = partido?.estado === 'EN_JUEGO';

  async function ejecutar(operacion: () => Promise<unknown>, texto: string) {
    if (ocupado.current || bloqueado) return;
    const version = vigente.current;
    ocupado.current = true;
    setProcesando(true);
    setError('');
    setMensaje('');
    let realizada = false;
    try {
      await operacion();
      realizada = true;
      if (vigente.current !== version) return;
      limpiarFormulario();
      setConfirmacion(null);
      setActualizado(false);
      setMensaje(texto);
      await cargarDatos(version);
    } catch (error) {
      if (vigente.current !== version) return;
      setActualizado(false);
      setConfirmacion(null);
      const detalle = error instanceof Error ? error.message : 'No se pudo completar la operación.';
      setError(realizada
        ? `La operación se realizó, pero no se pudieron actualizar los datos. Pulsa Actualizar sin repetir la operación. ${detalle}`
        : `${detalle} Actualiza los datos antes de volver a operar.`);
    } finally {
      if (vigente.current === version) {
        ocupado.current = false;
        setProcesando(false);
      }
    }
  }

  function nombreEquipo(equipoId: number) {
    return equipos.find((equipo) => equipo.id === equipoId)?.nombre ?? `Equipo ${equipoId}`;
  }

  function nombreJugador(idJugador: number) {
    const jugador = jugadores.find((item) => item.id === idJugador);
    return jugador
      ? `${jugador.nombre} ${jugador.apellido} — ${nombreEquipo(jugador.equipoId)}`
      : `Jugador ${idJugador} — Equipo no disponible`;
  }

  function guardarEvento() {
    if (ocupado.current || bloqueado || !enJuego) return;
    if (!jugadorId || !jugadores.some((jugador) => jugador.id === jugadorId)) {
      setError('Selecciona un jugador de los equipos del partido.');
      return;
    }
    if (!tipo) {
      setError('Selecciona el tipo de evento.');
      return;
    }
    if (!/^\d+$/.test(minuto.trim()) || Number(minuto) < 1 || Number(minuto) > 120) {
      setError('El minuto debe ser un entero entre 1 y 120.');
      return;
    }
    const datos = { jugadorId, tipo, minuto: Number(minuto) };
    if (editando !== null) {
      void ejecutar(() => corregirEvento(partidoId, editando, datos), 'Evento corregido.');
    } else {
      void ejecutar(() => registrarEvento(partidoId, datos), 'Evento registrado.');
    }
  }

  function editar(evento: EventoPartido) {
    if (bloqueado || !enJuego) return;
    setError('');
    setMensaje('');
    setConfirmacion(null);
    setEditando(evento.id);
    setJugadorId(evento.jugadorId);
    setTipo(evento.tipo);
    setMinuto(String(evento.minuto));
    setMostrarJugadores(false);
  }

  function confirmar() {
    if (!confirmacion || bloqueado || !partido) return;
    if ('estado' in confirmacion) {
      const destino = confirmacion.estado;
      if ((partido.estado === 'PROGRAMADO' && destino === 'SUSPENDIDO') ||
          (enJuego && (destino === 'FINALIZADO' || destino === 'SUSPENDIDO'))) {
        void ejecutar(() => cambiarEstadoPartido(partidoId, destino), 'Estado actualizado.');
      }
    } else if (enJuego) {
      const eventoId = confirmacion.eventoId;
      void ejecutar(() => eliminarEvento(partidoId, eventoId), 'Evento eliminado.');
    }
  }

  const estiloCampo = [styles.campo, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.pantalla}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.pantalla}>
        <KeyboardAvoidingView style={styles.pantalla} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
          <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
            {cargando && <ActivityIndicator accessibilityLabel="Cargando partido" />}
            {procesando && <ActivityIndicator accessibilityLabel="Procesando operación" />}
            {!!error && <ThemedText accessibilityRole="alert">{error}</ThemedText>}
            {!!mensaje && <ThemedText accessibilityLiveRegion="polite">{mensaje}</ThemedText>}
            {idValido && <Button variant="secondary" title={error ? 'Reintentar / Actualizar' : 'Actualizar'} disabled={cargando || procesando} onPress={() => void actualizar()} />}
            {partido && (
              <>
                <ThemedText type="subtitle">{nombreEquipo(partido.equipoLocalId)} vs. {nombreEquipo(partido.equipoVisitanteId)}</ThemedText>
                <ThemedText>Local: {nombreEquipo(partido.equipoLocalId)}</ThemedText>
                <ThemedText>Visitante: {nombreEquipo(partido.equipoVisitanteId)}</ThemedText>
                <ThemedText>Fecha/hora: {partido.fechaHoraInicio?.replace('T', ' ') || 'No disponible'}</ThemedText>
                <ThemedText type="smallBold">Estado: {partido.estado}</ThemedText>
                {!actualizado && <ThemedText>Actualiza para habilitar operaciones. Los datos visibles pueden estar desactualizados.</ThemedText>}
                {partido.estado === 'PROGRAMADO' && <Button title="Iniciar partido" disabled={bloqueado} onPress={() => void ejecutar(() => cambiarEstadoPartido(partidoId, 'EN_JUEGO'), 'Partido iniciado.')} />}
                {enJuego && <Button title="Finalizar" disabled={bloqueado} onPress={() => setConfirmacion({ estado: 'FINALIZADO' })} />}
                {(partido.estado === 'PROGRAMADO' || enJuego) && <Button variant="danger" title="Suspender" disabled={bloqueado} onPress={() => setConfirmacion({ estado: 'SUSPENDIDO' })} />}
                {confirmacion && (
                  <ThemedView type="backgroundElement" style={styles.bloque}>
                    <ThemedText>{'eventoId' in confirmacion ? '¿Eliminar este evento definitivamente?' : confirmacion.estado === 'FINALIZADO' ? '¿Finalizar el partido? No se podrán realizar más cambios.' : '¿Suspender el partido? No se podrán realizar más cambios.'}</ThemedText>
                    <Button title="Confirmar" disabled={bloqueado} onPress={confirmar} />
                    <Button variant="secondary" title="Cancelar" disabled={procesando} onPress={() => setConfirmacion(null)} />
                  </ThemedView>
                )}
                <ThemedText type="subtitle">Eventos</ThemedText>
                {eventos.length === 0 && <ThemedText style={[Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay eventos registrados.</ThemedText>}
                {eventos.map((evento) => (
                  <ThemedView key={evento.id} type="backgroundElement" style={styles.bloque}>
                    <ThemedText>{evento.minuto}′ — {evento.tipo}</ThemedText>
                    <ThemedText>{nombreJugador(evento.jugadorId)}</ThemedText>
                    {enJuego && (
                      <>
                        <Button variant="secondary" title={`Corregir evento ${evento.id}`} disabled={bloqueado} onPress={() => editar(evento)} />
                        <Button variant="danger" title={`Eliminar evento ${evento.id}`} disabled={bloqueado} onPress={() => setConfirmacion({ eventoId: evento.id })} />
                      </>
                    )}
                  </ThemedView>
                ))}
                {enJuego && (
                  <ThemedView style={styles.bloque}>
                    <ThemedText type="subtitle">{editando !== null ? `Corregir evento ${editando}` : 'Registrar evento'}</ThemedText>
                    <ThemedText>Jugador: {jugadorId ? nombreJugador(jugadorId) : 'Sin seleccionar'}</ThemedText>
                    <Button variant="secondary" title={mostrarJugadores ? 'Ocultar jugadores' : 'Seleccionar jugador'} disabled={bloqueado} onPress={() => setMostrarJugadores(!mostrarJugadores)} />
                    {mostrarJugadores && jugadores.map((jugador) => (
                      <Button key={jugador.id} title={nombreJugador(jugador.id)} disabled={bloqueado} onPress={() => { setJugadorId(jugador.id); setMostrarJugadores(false); }} />
                    ))}
                    {jugadores.length === 0 && <ThemedText style={[Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay jugadores disponibles para estos equipos.</ThemedText>}
                    <ThemedText>Tipo: {tipo ?? 'Sin seleccionar'}</ThemedText>
                    {(['GOL', 'AMARILLA', 'ROJA'] as const).map((opcion) => <Button key={opcion} title={opcion} disabled={bloqueado} onPress={() => setTipo(opcion)} />)}
                    <ThemedText>Minuto (1 a 120)</ThemedText>
                    <TextInput accessibilityLabel="Minuto" value={minuto} onChangeText={setMinuto} keyboardType="number-pad" editable={!bloqueado} style={estiloCampo} />
                    <Button title={editando !== null ? 'Guardar corrección' : 'Registrar evento'} disabled={bloqueado || jugadores.length === 0} onPress={guardarEvento} />
                    {editando !== null && <Button variant="secondary" title="Cancelar edición" disabled={procesando} onPress={limpiarFormulario} />}
                  </ThemedView>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    bloque: {
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
