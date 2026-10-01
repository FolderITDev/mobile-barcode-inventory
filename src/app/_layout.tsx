import { useEffect } from 'react';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
} from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useReducedMotion } from 'react-native-reanimated';
import { StoreProvider, useStore } from '@/data/store';
import { fonts, useTheme } from '@/theme';
import { Button, EmptyState, ScrollScreen } from '@/ui';

export const unstable_settings = { initialRouteName: 'index' };

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ fade: true, duration: 200 });

// Android aligns header titles left by default, which crowds the title against
// a text button like Cancel. Modals carry buttons on both sides, so center it.
const modalOptions = {
  presentation: 'modal',
  headerTitleAlign: 'center',
} as const;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    IBMPlexMono_500Medium,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_600SemiBold,
  });
  if (!loaded && !error) return null;
  return (
    <KeyboardProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Navigator />
      </StoreProvider>
    </KeyboardProvider>
  );
}

function Navigator() {
  const { colors } = useTheme();
  const { status, retry } = useStore();
  const reduceMotion = useReducedMotion();

  /** Keep the splash up until stored records are readable, so nothing flashes. */
  useEffect(() => {
    if (status.kind !== 'loading') SplashScreen.hide();
  }, [status.kind]);

  if (status.kind === 'loading') return null;
  if (status.kind === 'failed')
    return (
      <ScrollScreen>
        <EmptyState
          icon="alert"
          title="Counts could not open"
          body={status.error}
        >
          <Button label="Try again" onPress={retry} />
        </EmptyState>
      </ScrollScreen>
    );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.semibold, color: colors.ink },
        headerLargeTitleStyle: {
          fontFamily: fonts.condensed,
          color: colors.ink,
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
        animation: reduceMotion ? 'fade' : 'default',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Counts',
          headerLargeTitleEnabled: true,
          // iOS 26 hides a large title drawn over a solid header color.
          ...(Platform.OS === 'ios' && { headerStyle: {} }),
        }}
      />
      <Stack.Screen
        name="new"
        options={{ title: 'New count', ...modalOptions }}
      />
      <Stack.Screen name="count/[id]" options={{ title: 'Count' }} />
      <Stack.Screen
        name="scanner/[id]"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          contentStyle: { backgroundColor: '#05090E' },
        }}
      />
      <Stack.Screen
        name="review/[id]"
        options={{ title: 'Close count', ...modalOptions }}
      />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
