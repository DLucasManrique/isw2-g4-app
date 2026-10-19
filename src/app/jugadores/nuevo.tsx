
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput
} from 'react-native';

import { Equipo, listarEquipos } from '../../services/equipos';
import { crearJugador } from '../../services/jugadores';

export default function NuevoJugadorScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [camiseta, setCamiseta] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoEquipos, setCargandoEquipos] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarEquipos() {
      try {
        const datos = await listarEquipos();
        setEquipos(datos);
      } catch {
        setError('No se pudieron cargar los equipos');
      } finally {
        setCargandoEquipos(false);
      }
    }

    cargarEquipos();
  }, []);

  async function guardar() {
    setError('');

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
      setError('Seleccioná un equipo');
      return;
    }

    const numero = camiseta.trim() === '' ? null : Number(camiseta);

    if (
      numero !== null &&
      (!Number.isInteger(numero) || numero < 1 || numero > 99)
    ) {
      setError('La camiseta debe ser un número entre 1 y 99');
      return;
    }

    setCargando(true);

    try {
      await crearJugador({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        equipoId,
        numeroCamiseta: numero,
      });

      if (typeof window !== 'undefined') {
        window.alert('Jugador registrado correctamente');
      } else {
        Alert.alert('Éxito', 'Jugador registrado correctamente');
      }

      router.replace('/jugadores');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo registrar el jugador'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>Registrar jugador</Text>

      <Text>Nombre *</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre"
        maxLength={60}
      />

      <Text>Apellido *</Text>
      <TextInput
        style={styles.input}
        value={apellido}
        onChangeText={setApellido}
        placeholder="Apellido"
        maxLength={60}
      />

      <Text>DNI *</Text>
      <TextInput
        style={styles.input}
        value={dni}
        onChangeText={setDni}
        placeholder="DNI"
        maxLength={10}
      />

      <Text>Equipo *</Text>

      {cargandoEquipos ? (
        <ActivityIndicator />
      ) : equipos.length === 0 ? (
        <Text>No hay equipos disponibles.</Text>
      ) : (
        equipos.map((equipo) => (
          <Button
            key={equipo.id}
            title={
              equipoId === equipo.id
                ? `✓ ${equipo.nombre}`
                : equipo.nombre
            }
            onPress={() => setEquipoId(equipo.id)}
          />
        ))
      )}

      <Text>Número de camiseta (opcional)</Text>
      <TextInput
        style={styles.input}
        value={camiseta}
        onChangeText={setCamiseta}
        placeholder="1 a 99"
        keyboardType="number-pad"
      />

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <Button
        title={cargando ? 'Guardando...' : 'Guardar jugador'}
        onPress={guardar}
        disabled={cargando || cargandoEquipos || equipos.length === 0}
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
});
