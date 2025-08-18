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
  color: string;
  route: string;
}

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colors);

  const createOptions: CreateOption[] = [
    {
      icon: 'cart',
      title: 'Orders',
      color: colors.primary,
      route: '/create-order',
    },
    {
      icon: 'cube.box',
      title: 'Items',
      color: '#10b981',
      route: '/items',
    },
    {
      icon: 'doc.text',
      title: 'Tasks',
      color: colors.warning,
      route: '/create-issue',
    },
    {
      icon: 'note.text',
      title: 'Notes',
      color: '#10b981',
      route: '/notes',
    },
    {
      icon: 'person',
      title: 'Agents',
      color: '#3b82f6',
      route: '/agents',
    },
    {
      icon: 'square.grid.3x3',
      title: 'Groups',
      color: '#8b5cf6',
      route: '/groups',
    },
  ];

  

  const renderCreateOption = (option: CreateOption, index: number, styles: any) => (
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
      </View>
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
            {createOptions.map((option, index) => renderCreateOption(option, index, styles))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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