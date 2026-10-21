import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Liga Amateur Santafesina' }} />
        <Stack.Screen name="equipos" options={{ headerShown: false }} />
        <Stack.Screen name="partidos/index" options={{ title: 'Partidos' }} />
        <Stack.Screen name="partidos/[id]/detalle" options={{ title: 'Detalle de partido' }} />
        <Stack.Screen name="explore" options={{ title: 'Expo' }} />
      </Stack>
    </ThemeProvider>
  );
}
