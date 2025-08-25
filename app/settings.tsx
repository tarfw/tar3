import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Spacing, TextStyles } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { themeMode, setThemeMode } = useTheme();
  const { user, signOut } = useAuth();

  const handleThemeToggle = () => {
    // Cycle through theme modes: light → dark → system → light
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        <Text style={[TextStyles.h2, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* User Email */}
        {user && (
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginBottom: Spacing.xl }]}>
            {user.email}
          </Text>
        )}

        {/* Theme */}
        <TouchableOpacity style={styles.item} onPress={handleThemeToggle}>
          <Text style={[TextStyles.body, { color: colors.text }]}>Theme</Text>
          <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
            {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
          </Text>
        </TouchableOpacity>

        {/* Sign Out */}
        <TouchableOpacity style={styles.item} onPress={handleSignOut}>
          <Text style={[TextStyles.body, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
});