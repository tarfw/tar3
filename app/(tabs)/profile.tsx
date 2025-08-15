import { IconSymbol } from '@/components/ui/IconSymbol';
import { SyncSettings } from '@/components/ui/SyncSettings';
import { HybridIssueDemo } from '@/components/ui/HybridIssueDemo';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useTheme } from '@/contexts/ThemeContext';
import { useHybridDb } from '@/contexts/HybridDbContext';
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

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { themeMode, setThemeMode } = useTheme();
  const hybridDb = useHybridDb();

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
      icon: 'plus.rectangle.on.folder',
      title: 'Import from CSV',
      subtitle: 'Import issues from a CSV file',
      route: '/import-csv',
    },
    {
      icon: 'square.and.arrow.down',
      title: 'Templates',
      subtitle: 'Use a project template',
      route: '/templates',
    },
    {
      icon: 'doc.on.clipboard',
      title: 'Duplicate Project',
      subtitle: 'Copy an existing project',
      route: '/duplicate-project',
    },
  ];

  const handleInitializeDemoData = () => {
    Alert.alert(
      'Initialize Demo Data',
      'This feature is not yet implemented.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await hybridDb.createNote({
        title: 'New Note',
        content: ''
      });
      router.push(`/note/${newNote.id}`);
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note');
    }
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

  const renderCreateOption = (option: CreateOption, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.createOption, { backgroundColor: colors.surface }]}
      onPress={() => {
        if (option.route === '/create-note') {
          handleCreateNote();
        } else {
          router.push(option.route as any);
        }
      }}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            Create
          </Text>
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
            Start something new
          </Text>
        </View>

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

        {/* Hybrid Database Demo */}
        <HybridIssueDemo />

        {/* Database Sync Settings */}
        <SyncSettings />

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
              onPress={handleInitializeDemoData}
            >
              <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <IconSymbol size={20} name="plus.rectangle.on.folder" color={colors.icon} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[TextStyles.body, { color: colors.text }]}>
                  Initialize Demo Data
                </Text>
                <Text style={[TextStyles.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  Create sample projects and issues
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
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
});