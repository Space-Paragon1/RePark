import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Import each weight by path, so only these four font files go into the app.
import { Overpass_700Bold } from '@expo-google-fonts/overpass/700Bold';
import { Overpass_800ExtraBold } from '@expo-google-fonts/overpass/800ExtraBold';
import { OverpassMono_500Medium } from '@expo-google-fonts/overpass-mono/500Medium';
import { OverpassMono_600SemiBold } from '@expo-google-fonts/overpass-mono/600SemiBold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationResponder } from '@/components/NotificationResponder';
import { ToastProvider } from '@/components/Toast';
import { useTheme } from '@/lib/theme';

// Keep the splash screen up until the fonts are ready, so text doesn't jump.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Overpass_700Bold,
    Overpass_800ExtraBold,
    OverpassMono_500Medium,
    OverpassMono_600SemiBold,
  });
  // If the fonts fail to load, carry on with the system font rather than hang on the splash.
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <ToastProvider>
          <NotificationResponder />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
