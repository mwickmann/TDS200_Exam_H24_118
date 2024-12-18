
import React, { useEffect } from 'react';
import { AuthSessionProvider } from '../providers/authctx'; 
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { ThemeSessionProvider } from '../providers/ThemeSessionProvider';
import 'react-native-get-random-values';



SplashScreen.preventAutoHideAsync();


// rooten i prosjektet!!
export default function RootLayout() {

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Montserrat: require('../assets/fonts/Montserrat-Bold.ttf'),
    QuicksandRegular: require('../assets/fonts/Quicksand-Regular.ttf'),
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
    <ThemeSessionProvider> 
      <AuthSessionProvider> 
        <ThemeProvider value={DarkTheme}> 
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#000' }, 
            }}
          >
            <Stack.Screen name="index" options={{ title: "Index", headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="SignInScreen" options={{ title: "Log In", headerShown: false }} />
            <Stack.Screen name="ArtWorkDetail/[artworkId]" options={{ title: "Art Details", headerBackTitle: "Back",}} />
            <Stack.Screen name="Exhibition/[id]" options={{ title: "Exhibition Details", headerBackTitle: "Back"}} />
            <Stack.Screen name="UserProfile/[id]" options={{ title: "User", headerBackTitle: "Back"}} />
          
          </Stack>
        </ThemeProvider>
      </AuthSessionProvider>
    </ThemeSessionProvider>
  );
}
