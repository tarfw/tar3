import { IconSymbol } from '@/components/ui/IconSymbol';
import { LocalItem, useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ItemsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const hybridDb = useHybridDb();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'surface') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  // Get items from database
  const items = hybridDb.getAllItems();

  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateItem = () => {
    router.push('/item/new');
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await hybridDb.deleteItem(itemId);
    } catch (error) {
      console.error('Delete item error:', error);
    }
  };

  const handleSync = async () => {
  try {
    await hybridDb.syncWithTurso();
  } catch (error) {
    console.error('Sync error:', error);
  }
};

  const getTotalStock = (item: LocalItem): number => {
    const variants = hybridDb.getVariantsByItemId(item.id);
    return variants.reduce((total, variant) => total + variant.stock, 0);
  };

  const getLowestPrice = (item: LocalItem): number => {
    const variants = hybridDb.getVariantsByItemId(item.id);
    if (variants.length === 0) return 0;
    return Math.min(...variants.map(v => v.price));
  };

  const getVariantCount = (item: LocalItem): number => {
    return hybridDb.getVariantsByItemId(item.id).length;
  };

  const renderItem = ({ item }: { item: LocalItem }) => (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor: cardColor, borderColor }]}
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteItem(item.id);
            }}
          >
            <IconSymbol size={18} name="trash" color="#ef4444" />
          </TouchableOpacity>
        </View>
        
        {item.category && (
          <Text style={[styles.itemCategory, { color: tintColor }]}>
            {item.category}
          </Text>
        )}
        
        <View style={styles.itemStats}>
          <View style={styles.statItem}>
            <IconSymbol size={14} name="cube.box" color={secondaryTextColor} />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {getTotalStock(item)} in stock
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <IconSymbol size={14} name="tag" color={secondaryTextColor} />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              ${getLowestPrice(item).toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <IconSymbol size={14} name="square.grid.2x2" color={secondaryTextColor} />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {getVariantCount(item)} variants
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.searchContainer, { backgroundColor: borderColor + '40' }]}>
        <IconSymbol size={20} name="magnifyingglass" color={secondaryTextColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search items..."
          placeholderTextColor={secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol size={20} name="xmark.circle.fill" color={secondaryTextColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="cube.box" color={secondaryTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No items yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
        Tap the + button to create your first item
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Items
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleSync}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: tintColor }]}>Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateItem}
            style={styles.headerButton}
          >
            <IconSymbol size={20} name="plus" color={tintColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredItems.length === 0 && styles.listContentEmpty
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  listContent: {
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  itemCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  itemCategory: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});