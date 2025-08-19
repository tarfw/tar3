// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, Platform, type StyleProp, type TextStyle } from 'react-native';

// Conditionally import expo-symbols only on iOS
let SymbolView: any = null;
let SymbolViewProps: any = null;
let SymbolWeight: any = null;
let isSymbolsAvailable = false;

// Only attempt to load expo-symbols on iOS to avoid Android native module issues
if (Platform.OS === 'ios') {
  try {
    const expoSymbols = require('expo-symbols');
    SymbolView = expoSymbols.SymbolView;
    SymbolViewProps = expoSymbols.SymbolViewProps;
    SymbolWeight = expoSymbols.SymbolWeight;
    isSymbolsAvailable = true;
  } catch (error) {
    console.warn('expo-symbols not available on iOS, falling back to MaterialIcons');
    isSymbolsAvailable = false;
  }
}

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation icons
  'house.fill': 'home',
  'house': 'home',
  'tray.fill': 'inbox',
  'tray': 'inbox',
  'magnifyingglass': 'search',
  'folder.fill': 'folder',
  'folder': 'folder',
  'plus.circle': 'add-circle-outline',
  
  // Common icons
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'ellipsis': 'more-horiz',
  'line.3.horizontal.decrease': 'filter-list',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
  'circle': 'radio-button-unchecked',
  'circle.fill': 'radio-button-checked',
  'exclamationmark.triangle': 'warning',
  'exclamationmark.3': 'error',
  'exclamationmark.2': 'error-outline',
  'minus': 'remove',
  'arrow.down': 'keyboard-arrow-down',
  'arrow.up.circle': 'arrow-circle-up',
  'arrow.up.circle.fill': 'arrow-circle-up',
  
  // Theme and settings icons
  'sun.max': 'wb-sunny',
  'moon': 'brightness-3',
  'gear': 'settings',
  'paintbrush': 'palette',
  'plus.rectangle.on.folder': 'create-new-folder',
  
  // Document and content icons
  'doc.text': 'description',
  'photo': 'photo',
  'play.rectangle': 'play-circle-outline',
  'tag': 'label',
  'person.3': 'group',
  'square.and.arrow.down': 'download',
  'doc.on.clipboard': 'content-copy',
  
  // Additional icons for UI components
  'xmark': 'close',
  'checkmark': 'check',
  'xmark.circle': 'cancel',
  
  // Missing icons causing warnings
  'plus': 'add',
  'plus.circle.fill': 'add-circle',
  'bubble.left.fill': 'chat-bubble',
  'trash': 'delete',
  'hourglass': 'hourglass-empty',
  'note.text': 'note',
  'xmark.circle.fill': 'cancel',
  'exclamationmark.triangle.fill': 'warning',
  'arrow.up': 'keyboard-arrow-up',
  'person': 'person',
  'person.fill': 'person',
  'calendar': 'event',
  
  // Tab bar icons
  'app': 'crop-square',
  'app.fill': 'crop-square',
  'at': 'alternate-email',
  'globe': 'public',
  'gamecontroller': 'sports-esports',
  
  // Additional requested mappings
  'list.bullet': 'format-list-bulleted',
  'gearshape': 'settings',
  'cart': 'shopping-cart',
  'cube.box': 'inventory',
  'square.grid.3x3': 'grid-view',
  'square.grid.2x2': 'apps',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: any;
}) {
  // Use native SF Symbols on iOS if available and properly configured
  if (Platform.OS === 'ios' && isSymbolsAvailable && SymbolView) {
    try {
      return (
        <SymbolView
          name={name}
          size={size}
          tintColor={color}
          weight={weight}
          style={style}
        />
      );
    } catch (error) {
      console.warn(`IconSymbol: Error rendering SF Symbol "${name}", falling back to Material Icon:`, error);
      // Fall through to Material Icons fallback
    }
  }

  // Fallback to Material Icons on Android and web (or iOS if SymbolView unavailable)
  const materialIconName = MAPPING[name];
  if (!materialIconName) {
    console.warn(`IconSymbol: No Material Icon mapping found for "${name}"`);
    return null;
  }

  return <MaterialIcons color={color} size={size} name={materialIconName} style={style} />;
}
