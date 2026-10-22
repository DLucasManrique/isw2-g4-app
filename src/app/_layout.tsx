import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SesionProvider, useSesion } from '@/contexts/SesionContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SesionProvider>
        <Navegacion />
      </SesionProvider>
    </ThemeProvider>
  );
}

function Navegacion() {
  const { usuario, cargando } = useSesion();
  if (cargando) return <ActivityIndicator accessibilityLabel="Recuperando sesión" style={{ flex: 1 }} />;

  return (
    <Stack>
      <Stack.Protected guard={!usuario}>
        <Stack.Screen name="login" options={{ title: 'Inicio de sesión' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!usuario}>
  <Stack.Screen name="index" options={{ title: 'Liga Amateur Santafesina' }} />
  <Stack.Screen name="equipos" options={{ headerShown: false }} />
  <Stack.Screen name="partidos/[id]" options={{ title: 'Partido en vivo' }} />
  <Stack.Screen name="catalogo" options={{ title: 'Catálogo' }} />
  <Stack.Screen name="posiciones" options={{ title: 'Tabla de posiciones' }} />
  <Stack.Screen name="explore" options={{ title: 'Expo' }} />
</Stack.Protected>
    </Stack>
  );
}
