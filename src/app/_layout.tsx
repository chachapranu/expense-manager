import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as LocalAuthentication from 'expo-local-authentication';
import { getDatabase } from '../services/database';
import { Colors, DarkColors } from '../constants';
import { useSettingsStore } from '../store/useSettingsStore';

SplashScreen.preventAutoHideAsync();

function getTheme(isDarkMode: boolean) {
  const colors = isDarkMode ? DarkColors : Colors;
  const base = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      secondary: colors.secondary,
      error: colors.error,
      background: colors.background,
      surface: colors.surface,
    },
  };
}

async function authenticate(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return true;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return true;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Expense Manager',
  });
  return result.success;
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const { isDarkMode, loadSettings } = useSettingsStore();
  const colors = isDarkMode ? DarkColors : Colors;
  const theme = getTheme(isDarkMode);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        getDatabase();
        await loadSettings();
        const authed = await authenticate();
        if (!authed) {
          setAuthFailed(true);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return null;
  }

  if (authFailed) {
    return (
      <View style={[styles.authContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.authTitle, { color: colors.text }]}>Locked</Text>
        <Text style={[styles.authSubtitle, { color: colors.textSecondary }]}>
          Authentication is required to use Expense Manager
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const authed = await authenticate();
            if (authed) setAuthFailed(false);
          }}
        >
          <Text style={[styles.retryText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.surface,
              } as any,
              headerTintColor: colors.text,
              headerShadowVisible: false,
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transaction/[id]"
              options={{ title: 'Transaction Details' }}
            />
            <Stack.Screen
              name="transaction/add"
              options={{ title: 'Add Transaction' }}
            />
            <Stack.Screen
              name="settings/index"
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="settings/ignore-rules"
              options={{ title: 'Ignore Rules' }}
            />
            <Stack.Screen
              name="settings/categories"
              options={{ title: 'Categories' }}
            />
            <Stack.Screen
              name="settings/recurring"
              options={{ title: 'Recurring Expenses' }}
            />
            <Stack.Screen
              name="settings/accounts"
              options={{ title: 'Accounts' }}
            />
            <Stack.Screen
              name="settings/sms-sync"
              options={{ title: 'Sync SMS' }}
            />
            <Stack.Screen
              name="settings/export"
              options={{ title: 'Export Data' }}
            />
            <Stack.Screen
              name="settings/auto-categorization"
              options={{ title: 'Auto-Categorization' }}
            />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  authSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
