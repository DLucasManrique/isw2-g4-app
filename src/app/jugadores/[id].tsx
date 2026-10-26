
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
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
      <Text style={styles.titulo}>Editar jugador</Text>
      <Text style={styles.error}>
        {error || 'No se pudo cargar el jugador'}
      </Text>
      <Button
        title="Volver"
        onPress={() => router.replace('/jugadores')}
      />
    </ScrollView>
  );
}
  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Editar jugador</Text>

      <Text>Nombre *</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        maxLength={60}
      />

      <Text>Apellido *</Text>
      <TextInput
        style={styles.input}
        value={apellido}
        onChangeText={setApellido}
        maxLength={60}
      />

      <Text>DNI *</Text>
      <TextInput
        style={styles.input}
        value={dni}
        onChangeText={setDni}
        maxLength={10}
      />

      <Text>Equipo (no modificable)</Text>
      <TextInput
        style={styles.input}
        value={equipoId?.toString() ?? ''}
        editable={false}
      />

      <Text>Número de camiseta (opcional)</Text>
      <TextInput
        style={styles.input}
        value={camiseta}
        onChangeText={setCamiseta}
        keyboardType="number-pad"
        placeholder="1 a 99"
      />

      {error !== '' && (
        <Text style={styles.error}>{error}</Text>
      )}

      {mensaje !== '' && (
        <Text style={styles.mensaje}>{mensaje}</Text>
      )}

      <Button
        title={guardando ? 'Guardando...' : 'Guardar cambios'}
        onPress={guardar}
        disabled={guardando || equipoId === null}
      />

      <Button
        title="Cancelar"
        onPress={() => router.replace('/jugadores')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 8,
    padding: 12,
  },
  error: {
    color: '#b00020',
  },
  mensaje: {
    color: 'green',
  },
});
