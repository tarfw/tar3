import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/constants/Colors';
import { TextStyles, Spacing, Radius, Shadow } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LinearModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function LinearModal({
  visible,
  onClose,
  title,
  children,
  showSearch = false,
  onSearch,
}: LinearModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
        
        {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.backgroundElevated, 
          borderBottomColor: colors.border 
        }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol size={24} name="xmark" color={colors.iconPrimary} />
          </TouchableOpacity>
          <Text style={[TextStyles.headline, { color: colors.text, flex: 1, textAlign: 'center' }]}>
            {title}
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface LinearModalItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
  selected?: boolean;
  rightElement?: React.ReactNode;
}

export function LinearModalItem({
  title,
  subtitle,
  icon,
  onPress,
  selected = false,
  rightElement,
}: LinearModalItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: selected ? `${colors.primary}10` : 'transparent' },
      ]}
      onPress={onPress}
    >
      {icon && <View style={styles.itemIcon}>{icon}</View>}
      <View style={styles.itemContent}>
        <Text style={[
          TextStyles.body, 
          { color: selected ? colors.primary : colors.text }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (selected && (
        <IconSymbol size={16} name="checkmark" color={colors.primary} />
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Shadow.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  itemIcon: {
    marginRight: Spacing.md,
    width: 32,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
});
