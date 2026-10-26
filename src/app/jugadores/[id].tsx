import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import {
  modificarJugador,
  obtenerJugador,
} from '../../services/jugadores';

export default function EditarJugadorScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [camiseta, setCamiseta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    async function cargarJugador() {
      try {
        const jugador = await obtenerJugador(Number(id));

        setEquipoId(jugador.equipoId);
        setNombre(jugador.nombre);
        setApellido(jugador.apellido);
        setDni(jugador.dni);
        setCamiseta(
          jugador.numeroCamiseta?.toString() ?? ''
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'No se pudo cargar el jugador'
        );
      } finally {
        setCargando(false);
      }
    }

    cargarJugador();
  }, [id]);

  async function guardar() {
    setError('');
    setMensaje('');

    if (!nombre.trim() || !apellido.trim() || !dni.trim()) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (nombre.trim().length > 60 || apellido.trim().length > 60) {
      setError('Nombre y apellido no pueden superar los 60 caracteres');
      return;
    }

    if (dni.trim().length > 10) {
      setError('El DNI no puede superar los 10 caracteres');
      return;
    }

    if (equipoId === null) {
      setError('No se encontró el equipo del jugador');
      return;
    }

    const numero = camiseta.trim() === ''
      ? null
      : Number(camiseta);

    if (
      numero !== null &&
      (!Number.isInteger(numero) || numero < 1 || numero > 99)
    ) {
      setError('La camiseta debe ser un número entre 1 y 99');
      return;
    }

    setGuardando(true);

    try {
      await modificarJugador(Number(id), {
        equipoId,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        numeroCamiseta: numero,
      });

      setMensaje('Jugador modificado correctamente');
      router.replace('/jugadores');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo modificar el jugador'
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <ActivityIndicator size="large" />;
  }
if (equipoId === null) {
  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={[styles.texto, styles.titulo]}>Editar jugador</Text>
      <Text style={[styles.texto, styles.error]}>
        {error || 'No se pudo cargar el jugador'}
      </Text>
      <Button variant="secondary"
        title="Volver"
        onPress={() => router.replace('/jugadores')}
      />
    </ScrollView>
  );
}
  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={[styles.texto, styles.titulo]}>Editar jugador</Text>

      <Text style={styles.texto}>Nombre *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        maxLength={60}
      />

      <Text style={styles.texto}>Apellido *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={apellido}
        onChangeText={setApellido}
        maxLength={60}
      />

      <Text style={styles.texto}>DNI *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={dni}
        onChangeText={setDni}
        maxLength={10}
      />

      <Text style={styles.texto}>Equipo (no modificable)</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={equipoId?.toString() ?? ''}
        editable={false}
      />

      <Text style={styles.texto}>Número de camiseta (opcional)</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={camiseta}
        onChangeText={setCamiseta}
        keyboardType="number-pad"
        placeholder="1 a 99"
      />

      {error !== '' && (
        <Text style={[styles.texto, styles.error]}>{error}</Text>
      )}

      {mensaje !== '' && (
        <Text style={[styles.texto, styles.mensaje]}>{mensaje}</Text>
      )}

      <Button
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardar}
        disabled={guardando || equipoId === null}
      />

      <Button variant="secondary"
        title="Cancelar"
        onPress={() => router.replace('/jugadores')}
      />
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    texto: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    contenedor: {
      flexGrow: 1,
      ...Visual.content,
      backgroundColor: theme.background,
    },
    titulo: {
      marginBottom: 10,
      ...Visual.title,
    },
    input: {
      padding: 12,
      ...Visual.input,
      color: theme.text,
      borderColor: theme.border,
      backgroundColor: theme.backgroundElement,
    },
    error: {
      ...Visual.message,
      color: theme.danger,
      backgroundColor: theme.dangerBackground,
    },
    mensaje: {
      color: theme.success,
    },
  });
