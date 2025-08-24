/**
 * Linear Design System Typography
 * Based on Linear's mobile app design
 */

export const Typography = {
  // Font families
  fontFamily: {
    regular: 'System', // Using system fonts for better performance
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 40,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
};

export const Spacing = {
  // Base spacing unit (4px)
  base: 4,
  
  // Spacing scale
  xs: 4,   // 4px
  sm: 8,   // 8px
  md: 12,  // 12px
  lg: 16,  // 16px
  xl: 20,  // 20px
  '2xl': 24,  // 24px
  '3xl': 32,  // 32px
  '4xl': 40,  // 40px
  '5xl': 48,  // 48px
  '6xl': 64,  // 64px
};

export const Radius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
};

// Text styles combining typography properties
export const TextStyles = {
  // Headers
  h1: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight['3xl'],
  },
  h2: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.lineHeight['2xl'],
  },
  h3: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.lineHeight.xl,
  },
  h4: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.lineHeight.lg,
  },

  // Body text
  bodyLarge: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.lg,
  },
  body: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.base,
  },
  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.sm,
  },

  // Labels and captions
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.lineHeight.sm,
  },
  caption: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.xs,
  },

  // Interactive elements
  button: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.lineHeight.base,
  },
  buttonSmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.lineHeight.sm,
  },
};
