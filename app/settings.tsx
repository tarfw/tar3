import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
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

  const handleThemeChange = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Light', 
          onPress: () => setThemeMode('light'),
          style: themeMode === 'light' ? 'default' : undefined
        },
        { 
          text: 'Dark', 
          onPress: () => setThemeMode('dark'),
          style: themeMode === 'dark' ? 'default' : undefined
        },
        { 
          text: 'System', 
          onPress: () => setThemeMode('system'),
          style: themeMode === 'system' ? 'default' : undefined
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: signOut,
          style: 'destructive'
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol size={24} name="chevron.left" color={colors.text} />
          </TouchableOpacity>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            Settings
          </Text>
        </View>

        {/* User Profile Card */}
        {user && (
          <View style={styles.section}>
            <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
              ACCOUNT
            </Text>
            <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[TextStyles.h3, { color: colors.primary }]}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[TextStyles.label, { color: colors.text }]}>
                  {user.email}
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Signed in with magic code
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            PREFERENCES
          </Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={handleThemeChange}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <IconSymbol size={20} name="paintbrush" color={colors.icon} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[TextStyles.body, { color: colors.text }]}>
                  Theme
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Currently: {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                </Text>
              </View>
              <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            ACCOUNT ACTIONS
          </Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surface }]}
              onPress={handleSignOut}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.error + '20' }]}>
                <IconSymbol size={20} name="rectangle.portrait.and.arrow.right" color={colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[TextStyles.body, { color: colors.error }]}>
                  Sign Out
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Sign out of your account
                </Text>
              </View>
              <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  settingsContainer: {
    gap: Spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
});