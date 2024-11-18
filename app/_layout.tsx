import { AuthSessionProvider } from '../providers/authctx';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {ThemeSessionProvider} from '../providers/ThemeSessionProvider'
import ArtworkDetail from './ArtWorkDetail/ArtWorkDetailScreen';

import SignInScreen from './SignInScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeSessionProvider> {/* Theme-konfigurasjonen pakkes rundt alt */}
    <AuthSessionProvider> {/* Auth-konfigurasjonen inni Theme-konfigurasjonen */}
    <ThemeProvider value={DarkTheme}> {/* Bruk DarkTheme som standard */}
      <Stack   screenOptions={{
              contentStyle: { backgroundColor: '#000' }, // Setter svart bakgrunn på alle skjermer
            }}
          >
      <Stack.Screen name="index" options={{ title: "Index", headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="SignInScreen"options={{ title: "Log In", headerShown: false }}/>
      <Stack.Screen name="ArtWorkDetail/[artworkId]" options={{ title: "Art Details" }} />
      </Stack>
      </ThemeProvider>
    </AuthSessionProvider>
  </ThemeSessionProvider>
);
}

