import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Equipo, listarEquipos } from '../../services/equipos';
import { darDeBajaJugador, listarJugadores } from '../../services/jugadores';
import { Jugador } from '../../types/jugador';

export default function JugadoresScreen() {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoId, setEquipoId] = useState<number | undefined>();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorEquipos, setErrorEquipos] = useState('');
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargarEquipos() {
      setErrorEquipos('');

      try {
        const datos = await listarEquipos();

        if (activo) {
          setEquipos(datos);
        }
      } catch (error) {
        if (activo) {
          setErrorEquipos(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los equipos'
          );
        }
      }
    }

    cargarEquipos();

    return () => {
      activo = false;
    };
  }, [recarga]);

  useEffect(() => {
    let activo = true;

    async function cargarJugadores() {
      setCargando(true);
      setError('');

      try {
        const datos = await listarJugadores(equipoId);

        if (activo) {
          setJugadores(datos);
        }
      } catch (error) {
        if (activo) {
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los jugadores'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarJugadores();

    return () => {
      activo = false;
    };
  }, [equipoId, recarga]);

async function eliminarJugador(id: number) {
  const confirmar = async () => {
    try {
      await darDeBajaJugador(id);
      setRecarga((valor) => valor + 1);
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudo dar de baja al jugador';

      setError(mensaje);
    }
  };

  if (typeof window !== 'undefined') {
    if (window.confirm('¿Seguro que querés dar de baja a este jugador?')) {
      await confirmar();
    }
  } else {
    Alert.alert(
      'Confirmar baja',
      '¿Seguro que querés dar de baja a este jugador?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Dar de baja',
          style: 'destructive',
          onPress: () => {
            void confirmar();
          },
        },
      ]
    );
  }
}

  function nombreEquipo(id: number) {
    const equipo = equipos.find((equipo) => equipo.id === id);
    return equipo?.nombre || `Equipo ${id}`;
  }

  return (
    <View style={styles.contenedor}>
     <Text style={styles.titulo}>Jugadores</Text>

<Button
  title="Nuevo jugador"
  onPress={() => router.push('/jugadores/nuevo')}
/>

<Text>Filtrar por equipo</Text>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          <Pressable
            onPress={() => setEquipoId(undefined)}
            style={[
              styles.filtro,
              equipoId === undefined && styles.seleccionado,
            ]}
          >
            <Text>Todos</Text>
          </Pressable>

          {equipos.map((equipo) => (
            <Pressable
              key={equipo.id}
              onPress={() => setEquipoId(equipo.id)}
              style={[
                styles.filtro,
                equipoId === equipo.id && styles.seleccionado,
              ]}
            >
              <Text>{equipo.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {errorEquipos !== '' && (
        <Text style={styles.error}>{errorEquipos}</Text>
      )}

      <Button
        title="Actualizar"
        onPress={() => setRecarga((valor) => valor + 1)}
        disabled={cargando}
      />

      {cargando ? (
        <ActivityIndicator size="large" />
      ) : error !== '' ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={jugadores}
          keyExtractor={(jugador) => jugador.id.toString()}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text>No hay jugadores activos para mostrar.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={styles.nombre}>
                {item.nombre} {item.apellido}
              </Text>
              <Text>Equipo: {nombreEquipo(item.equipoId)}</Text>
              <Text>DNI: {item.dni}</Text>
              <Text>
                Camiseta: {item.numeroCamiseta ?? 'Sin asignar'}
              </Text>
            <Button
  title="Editar jugador"
  onPress={() =>
    router.push({
      pathname: '/jugadores/[id]',
      params: { id: String(item.id) },
    })
  }
/>
<Button
  title="Dar de baja"
  color="#b00020"
  onPress={() => eliminarJugador(item.id)}
/>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  filtros: {
    gap: 8,
  },
  filtro: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
  },
  seleccionado: {
    backgroundColor: '#a7d5ff',
  },
  lista: {
    paddingBottom: 100,
    gap: 12,
  },
  tarjeta: {
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#b00020',
  },
});