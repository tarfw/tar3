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
import { HybridDbProvider, TURSO_DB_NAME, tursoOptions } from '@/contexts/HybridDbContext';
import { ThemeProvider, useColorScheme } from '@/contexts/ThemeContext';
import { runMigrations } from '@/lib/migrations';

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
          <Stack.Screen name="items" options={{ headerShown: false }} />
          <Stack.Screen name="item/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="groups" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="agents" options={{ headerShown: false }} />
          <Stack.Screen name="aichat" options={{ headerShown: false }} />
          <Stack.Screen name="tables" options={{ headerShown: false }} />
          <Stack.Screen name="posts" options={{ headerShown: false }} />
          <Stack.Screen name="posts-settings" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </AuthProvider>
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

  // Check if Turso is configured
  const isTursoConfigured = Boolean(tursoOptions.url && tursoOptions.authToken);

  return (
    <ThemeProvider>
      {isTursoConfigured ? (
        <SQLiteProvider
          databaseName={TURSO_DB_NAME}
          options={{
            libSQLOptions: {
              url: tursoOptions.url!,
              authToken: tursoOptions.authToken!,
            },
          }}
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
      )}
    </ThemeProvider>
  );
}
