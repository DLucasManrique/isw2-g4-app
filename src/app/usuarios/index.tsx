import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    darDeBajaUsuario,
    ErrorUsuarios,
    listarUsuarios,
} from '../../services/usuariosService';
import { Usuario } from '../../types/usuario';
import { useSesion } from '@/contexts/SesionContext';

export default function UsuariosScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { invalidarSesion } = useSesion();
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
      if (e instanceof ErrorUsuarios && e.status === 401) {
        await invalidarSesion();
        return;
      }
      setError(
        e instanceof Error ? e.message : 'No se pudieron cargar los usuarios'
      );
    } finally {
      setCargando(false);
    }
  }, [invalidarSesion]);

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
      if (e instanceof ErrorUsuarios && e.status === 401) {
        await invalidarSesion();
        return;
      }
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
      <Text style={[styles.texto, styles.titulo]}>Gestión de usuarios</Text>

      <Button
        title="Nuevo usuario"
        onPress={() => router.push('/usuarios/nuevo')}
      />

      <Button variant="secondary"
        title="Actualizar"
        onPress={() => void cargarUsuarios()}
        disabled={cargando}
      />

      {errorOperacion !== '' && (
        <Text style={[styles.texto, styles.error]}>{errorOperacion}</Text>
      )}

      {cargando ? (
        <ActivityIndicator size="large" />
      ) : error !== '' ? (
        <Text style={[styles.texto, styles.error]}>{error}</Text>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(usuario) => String(usuario.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={[styles.texto, Visual.message, { backgroundColor: theme.backgroundElement }]}>No hay usuarios registrados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.tarjeta}>
              <Text style={[styles.texto, styles.nombre]}>{item.nombreCompleto}</Text>
              <Text style={styles.texto}>Usuario: {item.username}</Text>
              <Text style={styles.texto}>Rol: {item.rol}</Text>

              <Text
                style={[styles.texto, item.activo ? styles.activo : styles.inactivo]}
              >
                Estado: {item.activo ? 'Activo' : 'Inactivo'}
              </Text>

              <Button variant="secondary"
                title="Editar"
                onPress={() =>
                  router.push({
                    pathname: '/usuarios/[id]',
                    params: { id: String(item.id) },
                  })
                }
              />

              {item.activo && item.rol !== 'ADMIN' && (
                <Button variant="danger"
                  title="Dar de baja"
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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    texto: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    contenedor: {
      flex: 1,
      ...Visual.content,
      backgroundColor: theme.background,
    },
    titulo: {
      ...Visual.title,
    },
    lista: {
      gap: 12,
      paddingBottom: 60,
    },
    tarjeta: {
      ...Visual.card,
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
    },
    nombre: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    activo: {
      color: theme.success,
    },
    inactivo: {
      color: theme.danger,
    },
    error: {
      ...Visual.message,
      color: theme.danger,
      backgroundColor: theme.dangerBackground,
    },
  });
