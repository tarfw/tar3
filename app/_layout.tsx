// Polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-reanimated';

// Polyfill for structuredClone (required by AI SDK)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import { HybridDbProvider } from '@/contexts/HybridDbContext';
import { ThemeProvider, useColorScheme } from '@/contexts/ThemeContext';
import { TursoProvider, useTurso } from '@/contexts/TursoContext';
import { runMigrations } from '@/lib/migrations';

// Turso DB Configuration
const TURSO_DB_NAME = 'tar.db';

function AppContent() {
  const colorScheme = useColorScheme();
  
  return (
    <AuthProvider>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="issue/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="create-issue" options={{ headerShown: false }} />
          <Stack.Screen name="groups" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="agents" options={{ headerShown: false }} />
          <Stack.Screen name="aichat" options={{ headerShown: false }} />
          <Stack.Screen name="tables" options={{ headerShown: false }} />
          <Stack.Screen name="posts" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </AuthProvider>
  );
}

function AppWithTurso() {
  const { isTursoConfigured, tursoUrl, tursoAuthToken } = useTurso();
  
  // Simplified SQLite provider without libsql sync features
  return isTursoConfigured && tursoUrl && tursoAuthToken ? (
    <SQLiteProvider
      databaseName={TURSO_DB_NAME}
      onInit={(db: SQLiteDatabase) => runMigrations(db)}
    >
      <HybridDbProvider enableTurso={true}>
        <AppContent />
      </HybridDbProvider>
    </SQLiteProvider>
  ) : (
    <HybridDbProvider enableTurso={false}>
      <AppContent />
    </HybridDbProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <TursoProvider>
      <ThemeProvider>
        <AppWithTurso />
      </ThemeProvider>
    </TursoProvider>
  );
}