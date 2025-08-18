import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { TextStyles, Spacing, Radius } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Product {
  id: string;
  title: string;
  image: string;
  store: string;
  price: number;
}

const productData: Product[] = [
  {
    id: '1',
    title: 'Illustrated Chocolate Bar',
    image: 'https://via.placeholder.com/150/FFD700/000000?text=Chocolate', // Placeholder for chocolate illustration
    store: 'Sweet Delights',
    price: 6.50,
  },
  {
    id: '2',
    title: 'Illustrated Coffee Cup',
    image: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Coffee', // Placeholder for coffee illustration
    store: 'Morning Brews',
    price: 4.00,
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [aiQuery, setAiQuery] = useState('');

  const filteredProducts = productData;

  const handleProductPress = (product: Product) => {
    console.log('Pressed product:', product);
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: colors.surface }]}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemTextContainer}>
        <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{item.store}</Text>
        <Text style={[TextStyles.label, { color: colors.text, marginTop: 2 }]}>{item.title}</Text>
        <Text style={[TextStyles.h4, { color: colors.primary, marginTop: 8 }]}>${item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {/* Category tabs removed */}
        </View>

        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.aiInputContainer, { backgroundColor: colors.backgroundSecondary }]}
      >
        <TextInput
          style={[styles.aiInput, { color: colors.text }]}
          placeholder="Ask AI to find products for you..."
          placeholderTextColor={colors.textTertiary}
          value={aiQuery}
          onChangeText={setAiQuery}
        />
        <TouchableOpacity>
          <IconSymbol name="arrow.up.circle.fill" size={32} color={colors.primary} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  itemContainer: {
    flex: 1,
    margin: Spacing.sm,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 120,
  },
  itemTextContainer: {
    padding: Spacing.md,
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 0.5,
    borderColor: Colors.light.border,
  },
  aiInput: {
    flex: 1,
    marginRight: Spacing.sm,
    ...TextStyles.body,
    paddingVertical: Spacing.sm,
  },
});