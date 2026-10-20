
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSesion } from '@/contexts/SesionContext';

export default function UsuariosLayout() {
  const { usuario, cargando } = useSesion();

  if (cargando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario || usuario.rol !== 'ADMIN') {
    return <Redirect href="/" />;
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Gestión de usuarios' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo usuario' }} />
      <Stack.Screen name="[id]" options={{ title: 'Editar usuario' }} />
    </Stack>
  );
}
