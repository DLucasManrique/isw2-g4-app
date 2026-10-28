import { Visual } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppButton as Button } from '@/components/app-button';

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { crearUsuario, ErrorUsuarios } from '../../services/usuariosService';
import { listarEquipos, type Equipo } from '@/services/equiposService';
import { useSesion } from '@/contexts/SesionContext';
import { REGLAS_PASSWORD, validarPassword } from '@/utils/validarPassword';

export default function NuevoUsuarioScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { invalidarSesion } = useSesion();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [equipoId, setEquipoId] = useState<number | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargandoEquipos, setCargandoEquipos] = useState(false);
  const [errorEquipos, setErrorEquipos] = useState('');
  const [intentoEquipos, setIntentoEquipos] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargandoEquipos(true);
    setErrorEquipos('');
    async function cargarEquipos() {
      try {
        const datos = await listarEquipos();
        if (vigente) setEquipos(datos);
      } catch (error) {
        if (vigente) setErrorEquipos(error instanceof Error ? error.message : 'No se pudieron cargar los equipos.');
      } finally {
        if (vigente) setCargandoEquipos(false);
      }
    }
    void cargarEquipos();
    return () => { vigente = false; };
  }, [intentoEquipos]);

  async function guardar() {
    setError('');

    if (!username.trim() || !password.trim() || !nombreCompleto.trim()) {
      setError('Completá todos los campos obligatorios');
      return;
    }

    if (guardando) {
      return;
    }

    const errorPassword = validarPassword(password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }
    if (cargandoEquipos || errorEquipos || !equipos.some((equipo) => equipo.id === equipoId)) {
      setError('Seleccioná un equipo existente para el delegado.');
      return;
    }

    setGuardando(true);

    try {
      await crearUsuario({
        username: username.trim(),
        password,
        nombreCompleto: nombreCompleto.trim(),
        rol: 'DELEGADO',
        equipoId,
        activo: true,
      });

      router.replace('/usuarios');
    } catch (e) {
      if (e instanceof ErrorUsuarios && e.status === 401) {
        await invalidarSesion();
        return;
      }
      setError(
        e instanceof Error ? e.message : 'No se pudo crear el usuario'
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenedor}>
      <Text style={[styles.texto, styles.titulo]}>Registrar usuario</Text>

      <Text style={styles.texto}>Nombre completo *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={nombreCompleto}
        onChangeText={setNombreCompleto}
        placeholder="Ej: Juan Pérez"
      />

      <Text style={styles.texto}>Nombre de usuario *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="Ej: jperez"
      />

      <Text style={styles.texto}>Contraseña *</Text>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!mostrarPassword}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Ingresar contraseña"
      />

      <Text style={styles.texto}>{REGLAS_PASSWORD}</Text>
      <Button variant="secondary" title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setMostrarPassword(!mostrarPassword)} />

      <Text style={styles.texto}>Rol: DELEGADO</Text>

      <View style={styles.roles}>
          <Text style={styles.texto}>Equipo *</Text>
          {cargandoEquipos ? <ActivityIndicator /> : errorEquipos ? (
            <>
              <Text style={styles.error} accessibilityRole="alert">{errorEquipos}</Text>
              <Button variant="secondary" title="Reintentar equipos" onPress={() => setIntentoEquipos((valor) => valor + 1)} />
            </>
          ) : equipos.length === 0 ? (
            <Text style={styles.texto}>Primero debe crearse un equipo para registrar un delegado.</Text>
          ) : equipos.map((equipo) => (
            <Button key={equipo.id} title={equipo.nombre} selected={equipo.id === equipoId} disabled={guardando} onPress={() => setEquipoId(equipo.id)} />
          ))}
      </View>

      {error !== '' && <Text style={[styles.texto, styles.error]}>{error}</Text>}

      {guardando ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button title="Guardar usuario" onPress={guardar} disabled={cargandoEquipos || !!errorEquipos || equipos.length === 0} />
      )}

      <Button variant="secondary"
        title="Cancelar"
        onPress={() => router.replace('/usuarios')}
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
    roles: {
      gap: 8,
    },
    error: {
      ...Visual.message,
      color: theme.danger,
      backgroundColor: theme.dangerBackground,
    },
  });
