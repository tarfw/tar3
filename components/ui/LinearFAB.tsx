import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { IconSymbol } from './IconSymbol';
import { Colors } from '@/constants/Colors';
import { TextStyles, Spacing, Radius, Shadow } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LinearFABProps {
  onPress: () => void;
  icon: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
  style?: any;
}

export function LinearFAB({
  onPress,
  icon,
  label,
  size = 'medium',
  variant = 'primary',
  style,
}: LinearFABProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const sizeStyles = {
    small: { width: 40, height: 40, borderRadius: 20 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const iconSizes = {
    small: 18,
    medium: 24,
    large: 28,
  };

  const backgroundColor = variant === 'primary' ? colors.primary : colors.backgroundElevated;
  const iconColor = variant === 'primary' ? colors.textInverse : colors.iconPrimary;

  if (label) {
    return (
      <TouchableOpacity
        style={[
          styles.extendedFAB,
          {
            backgroundColor,
            ...Shadow.lg,
          },
          style,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <IconSymbol size={iconSizes[size]} name={icon} color={iconColor} />
        <Text style={[
          TextStyles.button,
          { color: iconColor, marginLeft: Spacing.sm }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        sizeStyles[size],
        {
          backgroundColor,
          ...Shadow.lg,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <IconSymbol size={iconSizes[size]} name={icon} color={iconColor} />
    </TouchableOpacity>
  );
}

interface LinearSpeedDialProps {
  visible: boolean;
  onClose: () => void;
  actions: Array<{
    icon: string;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
}

export function LinearSpeedDial({
  visible,
  onClose,
  actions,
}: LinearSpeedDialProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />
      
      {/* Actions */}
      <View style={styles.speedDial}>
        {actions.map((action, index) => (
          <View key={index} style={styles.speedDialAction}>
            <View style={[styles.actionLabel, { backgroundColor: colors.backgroundElevated }]}>
              <Text style={[TextStyles.caption, { color: colors.text }]}>
                {action.label}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.color || colors.primary,
                  ...Shadow.md,
                }
              ]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <IconSymbol size={20} name={action.icon} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  extendedFAB: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 998,
  },
  speedDial: {
    position: 'absolute',
    bottom: 88,
    right: 24,
    zIndex: 999,
    gap: Spacing.md,
  },
  speedDialAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionLabel: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    ...Shadow.sm,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
