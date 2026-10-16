import { Stack } from 'expo-router';

export default function EquiposLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Gestión de equipos' }} />
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo equipo' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Detalle de equipo' }} />
      <Stack.Screen name="[id]/editar" options={{ title: 'Editar equipo' }} />
    </Stack>
  );
}
