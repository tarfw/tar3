import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import 'react-native-get-random-values';
import 'react-native-reanimated';

import { HybridDbProvider, TURSO_DB_NAME, tursoOptions } from '@/contexts/HybridDbContext';
import { ThemeProvider, useColorScheme } from '@/contexts/ThemeContext';
import { runMigrations } from '@/lib/migrations';

function AppContent() {
  const colorScheme = useColorScheme();
  
  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="issue/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="create-issue" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
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
  const isTursoConfigured = Boolean(
    "libsql://tar4-thamizhtar.aws-ap-south-1.turso.io" && 
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTUyMTQxNzAsImlkIjoiZDFhMjI1NjMtNDE2ZS00MWY3LTliYjUtODEyYTExMTczM2IzIiwicmlkIjoiZDZlZTYyOTItYTljZC00YzRmLWFkOWQtNjRmODk5N2ZmNzY2In0.VDURa4kpILRizxBZSTkRZxNkGoOOyNiz3ZSMmk0xR2sIeewkPFCHGZePWfTX7jhV9nbPL0bWYKaxfnOGlDH3Dw"
  );

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
