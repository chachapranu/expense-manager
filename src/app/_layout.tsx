import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getDatabase } from '../services/database';
import { Colors } from '../constants';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.secondary,
    error: Colors.error,
    background: Colors.background,
    surface: Colors.surface,
  },
};

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize database (this will also seed default data)
        getDatabase();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: Colors.primary,
              },
              headerTintColor: '#fff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
