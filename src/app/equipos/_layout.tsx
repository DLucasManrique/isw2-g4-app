import { Stack } from 'expo-router';
import { useSesion } from '@/contexts/SesionContext';

export default function EquiposLayout() {
  const { usuario } = useSesion();
  const esAdmin = usuario?.rol === 'ADMIN';
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: esAdmin ? 'Gestión de equipos' : 'Equipos' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Detalle de equipo' }} />
      <Stack.Protected guard={esAdmin}>
        <Stack.Screen name="nuevo" options={{ title: 'Nuevo equipo' }} />
        <Stack.Screen name="[id]/editar" options={{ title: 'Editar equipo' }} />
      </Stack.Protected>
    </Stack>
  );
}
