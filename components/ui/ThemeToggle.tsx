import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { colorScheme, themeMode, setThemeMode } = useTheme();
  const colors = Colors[colorScheme];

  const handleToggle = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('system');
    } else {
      setThemeMode('light');
    }
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light':
        return 'sun.max';
      case 'dark':
        return 'moon';
      case 'system':
        return 'gear';
      default:
        return 'sun.max';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <IconSymbol 
        size={size} 
        name={getIcon()} 
        color={colors.icon} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});