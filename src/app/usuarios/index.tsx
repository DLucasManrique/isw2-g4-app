
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    darDeBajaUsuario,
    listarUsuarios,
} from '../../services/usuariosService';
import { Usuario } from '../../types/usuario';

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorOperacion, setErrorOperacion] = useState('');

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const datos = await listarUsuarios();
      setUsuarios(datos);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar los usuarios'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarUsuarios();
    }, [cargarUsuarios])
  );

  async function confirmarBaja(id: number) {
    setErrorOperacion('');

    try {
      await darDeBajaUsuario(id);
      await cargarUsuarios();
    } catch (e) {
      setErrorOperacion(
        e instanceof Error ? e.message : 'No se pudo dar de baja al usuario'
      );
    }
  }

  function solicitarBaja(usuario: Usuario) {
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Dar de baja al usuario ${usuario.username}?`)) {
        void confirmarBaja(usuario.id);
      }
    } else {
      Alert.alert(
        'Confirmar baja',
        `¿Dar de baja al usuario ${usuario.username}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Dar de baja',
            style: 'destructive',
            onPress: () => void confirmarBaja(usuario.id),
          },
        ]
      );
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Gestión de usuarios</Text>

      <Button
        title="Nuevo usuario"
        onPress={() => router.push('/usuarios/nuevo')}
      />

      <Button
        title="Actualizar"
        onPress={() => void cargarUsuarios()}
        disabled={cargando}
      />

      {errorOperacion !== '' && (
        <Text style={styles.error}>{errorOperacion}</Text>
      )}

      {cargando ? (
        <ActivityIndicator size="large" />
      ) : error !== '' ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(usuario) => String(usuario.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text>No hay usuarios registrados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={styles.nombre}>{item.nombreCompleto}</Text>
              <Text>Usuario: {item.username}</Text>
              <Text>Rol: {item.rol}</Text>

              <Text
                style={item.activo ? styles.activo : styles.inactivo}
              >
                Estado: {item.activo ? 'Activo' : 'Inactivo'}
              </Text>

              <Button
                title="Editar"
                onPress={() =>
                  router.push({
                    pathname: '/usuarios/[id]',
                    params: { id: String(item.id) },
                  })
                }
              />

              {item.activo && (
                <Button
                  title="Dar de baja"
                  color="#b00020"
                  onPress={() => solicitarBaja(item)}
                />
              )}
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
    gap: 12,
    backgroundColor: '#ffffff',
  },
  titulo: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  lista: {
    gap: 12,
    paddingBottom: 60,
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 15,
    gap: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activo: {
    color: 'green',
  },
  inactivo: {
    color: '#b00020',
  },
  error: {
    color: '#b00020',
  },
});
