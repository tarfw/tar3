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

interface CreateOption {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  route: string;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { themeMode, setThemeMode } = useTheme();
  const { user, signOut } = useAuth();

  const createOptions: CreateOption[] = [
    {
      icon: 'doc.text',
      title: 'Issue',
      subtitle: 'Create a new issue or task',
      color: colors.primary,
      route: '/create-issue',
    },
    {
      icon: 'note.text',
      title: 'Note',
      subtitle: 'Write a quick note',
      color: '#10b981',
      route: '/create-note',
    },
    {
      icon: 'person.3',
      title: 'Team',
      subtitle: 'Create a new team',
      color: colors.warning,
      route: '/create-team',
    },
    {
      icon: 'tag',
      title: 'Label',
      subtitle: 'Add a new label',
      color: colors.error,
      route: '/create-label',
    },
  ];

  const quickActions = [
    {
      icon: 'note.text',
      title: 'Notes',
      subtitle: 'Create and manage notes',
      route: '/notes',
    },
    {
      icon: 'square.and.arrow.down',
      title: 'Templates',
      subtitle: 'Use a project template',
      route: '/templates',
    },
  ];



  const handleCreateNote = () => {
    router.push('/create-note');
  };

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

  const renderCreateOption = (option: CreateOption, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.createOption, { backgroundColor: colors.surface }]}
      onPress={() => router.push(option.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
        <IconSymbol size={24} name={option.icon} color={option.color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[TextStyles.label, { color: colors.text }]}>
          {option.title}
        </Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {option.subtitle}
        </Text>
      </View>
      <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} />
    </TouchableOpacity>
  );

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.quickAction, { backgroundColor: colors.surface }]}
      onPress={() => {
        if (action.route === '/notes') {
          router.push('/notes');
        } else {
          // For other routes, show that it's not implemented
          Alert.alert('Coming Soon', `${action.title} feature is not yet implemented.`);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <IconSymbol size={20} name={action.icon} color={colors.icon} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={[TextStyles.body, { color: colors.text }]}>
          {action.title}
        </Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {action.subtitle}
        </Text>
      </View>
      <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, elevation: 0 }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        style={{ elevation: 0 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            Profile
          </Text>
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
            {user?.email || 'Manage your account'}
          </Text>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.section}>
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

        {/* Main Create Options */}
        <View style={styles.section}>
          <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            CREATE NEW
          </Text>
          <View style={styles.createOptionsGrid}>
            {createOptions.map(renderCreateOption)}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            QUICK ACTIONS
          </Text>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>



        {/* Settings */}
        <View style={styles.section}>
          <Text style={[TextStyles.label, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            SETTINGS
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
    elevation: 0,
  },
  scrollContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    elevation: 0,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  createOptionsGrid: {
    gap: Spacing.sm,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  quickActionsContainer: {
    gap: Spacing.xs,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
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
});