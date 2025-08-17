import { IconSymbol } from '@/components/ui/IconSymbol';
import { LocalItem, LocalVariant, useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ItemScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const hybridDb = useHybridDb();
  const isNew = id === 'new';
  
  const [item, setItem] = useState<LocalItem>({
    id: 0,
    name: '',
    category: null,
    optionIds: '[]'
  });
  
  const [variants, setVariants] = useState<LocalVariant[]>([]);
  const [isEditing, setIsEditing] = useState(isNew);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'surface') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  useEffect(() => {
    if (!isNew) {
      const existingItem = hybridDb.getItem(parseInt(id as string));
      if (existingItem) {
        setItem(existingItem);
        setVariants(hybridDb.getVariantsByItemId(existingItem.id));
      }
    }
  }, [id, isNew, hybridDb]);

  const handleSave = async () => {
    if (!item.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    try {
      if (isNew) {
        const newItem = await hybridDb.createItem({
          name: item.name,
          category: item.category,
          optionIds: item.optionIds
        });
        
        if (newItem) {
          // Create variants
          for (const variant of variants) {
            await hybridDb.createVariant({
              ...variant,
              itemId: newItem.id
            });
          }
        }
        
        router.back();
      } else {
        await hybridDb.updateItem(item.id, {
          name: item.name,
          category: item.category,
          optionIds: item.optionIds
        });
        
        // Update variants
        for (const variant of variants) {
          if (variant.id > 0) {
            await hybridDb.updateVariant(variant.id, variant);
          } else {
            await hybridDb.createVariant({
              ...variant,
              itemId: item.id
            });
          }
        }
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const handleAddVariant = () => {
    const newVariant: LocalVariant = {
      id: -Date.now(), // Temporary negative ID for new variants
      itemId: item.id,
      sku: null,
      barcode: null,
      price: 0,
      stock: 0,
      status: 1,
      optionIds: '[]'
    };
    setVariants([...variants, newVariant]);
  };

  const handleUpdateVariant = (variantId: number, updates: Partial<LocalVariant>) => {
    setVariants(prev => prev.map(v => 
      v.id === variantId ? { ...v, ...updates } : v
    ));
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (variantId > 0) {
      // Existing variant - delete from database
      await hybridDb.deleteVariant(variantId);
    }
    // Remove from local state
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const renderVariant = (variant: LocalVariant, index: number) => (
    <View key={variant.id} style={[styles.variantCard, { backgroundColor: cardColor, borderColor }]}>
      <View style={styles.variantHeader}>
        <Text style={[styles.variantTitle, { color: textColor }]}>
          Variant {index + 1}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteVariant(variant.id)}
          style={styles.deleteVariantButton}
        >
          <IconSymbol size={16} name="trash" color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.variantForm}>
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>SKU</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={variant.sku || ''}
              onChangeText={(text) => handleUpdateVariant(variant.id, { sku: text })}
              placeholder="Enter SKU"
              placeholderTextColor={secondaryTextColor}
              editable={isEditing}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Barcode</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={variant.barcode || ''}
              onChangeText={(text) => handleUpdateVariant(variant.id, { barcode: text })}
              placeholder="Enter barcode"
              placeholderTextColor={secondaryTextColor}
              editable={isEditing}
            />
          </View>
        </View>
        
        <View style={styles.formRow}>
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Price</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={variant.price.toString()}
              onChangeText={(text) => handleUpdateVariant(variant.id, { price: parseFloat(text) || 0 })}
              placeholder="0.00"
              placeholderTextColor={secondaryTextColor}
              keyboardType="decimal-pad"
              editable={isEditing}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Stock</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={variant.stock.toString()}
              onChangeText={(text) => handleUpdateVariant(variant.id, { stock: parseInt(text) || 0 })}
              placeholder="0"
              placeholderTextColor={secondaryTextColor}
              keyboardType="number-pad"
              editable={isEditing}
            />
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Active</Text>
          <Switch
            value={variant.status === 1}
            onValueChange={(value) => handleUpdateVariant(variant.id, { status: value ? 1 : 0 })}
            disabled={!isEditing}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.left" color={tintColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {isNew ? 'New Item' : item.name}
        </Text>
        
        <TouchableOpacity
          onPress={isEditing ? handleSave : () => setIsEditing(true)}
          style={styles.actionButton}
        >
          <Text style={[styles.actionButtonText, { color: tintColor }]}>
            {isEditing ? 'Save' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>
          
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Name *</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={item.name}
              onChangeText={(text) => setItem({ ...item, name: text })}
              placeholder="Enter item name"
              placeholderTextColor={secondaryTextColor}
              editable={isEditing}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>Category</Text>
            <TextInput
              style={[styles.textInput, { color: textColor, borderColor }]}
              value={item.category || ''}
              onChangeText={(text) => setItem({ ...item, category: text })}
              placeholder="Enter category"
              placeholderTextColor={secondaryTextColor}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Variants */}
        <View style={[styles.section, { backgroundColor: cardColor }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Variants</Text>
            {isEditing && (
              <TouchableOpacity onPress={handleAddVariant} style={styles.addButton}>
                <IconSymbol size={20} name="plus" color={tintColor} />
              </TouchableOpacity>
            )}
          </View>
          
          {variants.length === 0 ? (
            <View style={styles.emptyVariants}>
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
                No variants yet. Add a variant to get started.
              </Text>
            </View>
          ) : (
            variants.map((variant, index) => renderVariant(variant, index))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    padding: 8,
  },
  variantCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  variantTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteVariantButton: {
    padding: 4,
  },
  variantForm: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyVariants: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});