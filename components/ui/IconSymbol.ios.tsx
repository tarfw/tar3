import { StyleProp, ViewStyle } from 'react-native';

// Conditionally import expo-symbols to avoid native module issues
let SymbolView: any = null;
let SymbolViewProps: any = null;
let SymbolWeight: any = null;

try {
  const expoSymbols = require('expo-symbols');
  SymbolView = expoSymbols.SymbolView;
  SymbolViewProps = expoSymbols.SymbolViewProps;
  SymbolWeight = expoSymbols.SymbolWeight;
} catch (error) {
  console.warn('expo-symbols not available in iOS-specific file, this should not happen');
}

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: any;
}) {
  if (!SymbolView) {
    console.warn('SymbolView not available, this should not happen on iOS');
    return null;
  }

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
