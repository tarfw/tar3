import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import 'react-native-get-random-values';
import 'react-native-reanimated';

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
  const isTursoConfigured = Boolean(
    "libsql://tar6-thamizhtar.aws-ap-south-1.turso.io" && 
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTU0NzI2MTksImlkIjoiZTczMGE0MzUtNjVlNS00NjkyLThkZjAtN2VlOGI4NTE3ZTQxIiwicmlkIjoiNGEwZjEzOGQtODJlMC00OTNlLWE2YjAtMjZmN2FkOTg4YmQ1In0.X9G0THVRqmhyKiKlv9aL6404aWqOHt6fv0P5RuIz3Fl-7WY_HtSJ-sDwVylIKWtFtSm-1-6_Mf9As3nvMMHcAw"
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
