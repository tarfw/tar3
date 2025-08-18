import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
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

  const createOptions: CreateOption[] = [
    {
      icon: 'cart',
      title: 'Order',
      subtitle: 'Create a new order',
      color: colors.primary,
      route: '/create-order',
    },
    {
      icon: 'cube.box',
      title: 'Items',
      subtitle: 'Add new items',
      color: '#10b981',
      route: '/items',
    },
    {
      icon: 'doc.text',
      title: 'Task',
      subtitle: 'Create a new task',
      color: colors.warning,
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
    {
      icon: 'square.grid.3x3',
      title: 'Groups',
      subtitle: 'Manage option groups',
      color: '#8b5cf6',
      route: '/groups',
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
    {
      icon: 'gearshape',
      title: 'Settings',
      subtitle: 'App preferences and account',
      route: '/settings',
    },
  ];

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
        } else if (action.route === '/settings') {
          router.push('/settings');
        } else {
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
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <IconSymbol size={24} name="gearshape" color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Main Create Options */}
        <View style={styles.section}>
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
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  settingsButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'transparent',
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
});