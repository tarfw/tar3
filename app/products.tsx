import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { TursoDb, useTursoDb } from '@/lib/tursoDb';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock: number;
  created_at: string | null;
}

export default function SimpleProductsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, userAppRecord } = useAuth();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });
  
  // Turso database configuration
  const tursoConfig = userAppRecord?.tursoDbName && userAppRecord?.tursoDbAuthToken
    ? {
        dbName: userAppRecord.tursoDbName,
        authToken: userAppRecord.tursoDbAuthToken
      }
    : null;
  
  // Initialize Turso database
  const tursoDb = useTursoDb(tursoConfig);

  // Load products when Turso database is ready
  useEffect(() => {
    if (tursoDb) {
      loadProducts();
    }
  }, [tursoDb]);

  const createProductsTable = async () => {
    if (!tursoDb) return;
    
    try {
      console.log('[SimpleProducts] Creating products table');
      await tursoDb.createTable('products', `
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL DEFAULT 0,
        category TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('[SimpleProducts] Products table created successfully');
    } catch (error) {
      console.error('[SimpleProducts] Error creating products table:', error);
    }
  };

  const loadProducts = async () => {
    if (!tursoDb) return;
    
    try {
      setIsLoading(true);
      
      // Create table if it doesn't exist
      await createProductsTable();
      
      console.log('[SimpleProducts] Loading products');
      const result = await tursoDb.selectFromTable('products', '1=1 ORDER BY created_at DESC');
      
      console.log('[SimpleProducts] Products query result:', JSON.stringify(result, null, 2));
      
      // Handle the new response format from Turso v2 API
      if (result && result.results && result.results.length > 0) {
        // The first result should be the execute response
        const executeResult = result.results[0];
        if (executeResult && executeResult.type === 'ok' && executeResult.response && executeResult.response.result) {
          const rows = executeResult.response.result.rows || [];
          const cols = executeResult.response.result.cols || [];
          
          console.log('[SimpleProducts] Rows:', rows);
          console.log('[SimpleProducts] Cols:', cols);
          
          // Convert rows to objects using column names
          const productsData = rows.map((row: any) => {
            const product: any = {};
            cols.forEach((col: any, index: number) => {
              product[col.name] = row[index];
            });
            return product;
          }).map((row: any) => ({
            id: row.id || 0,
            name: row.name || '',
            description: row.description || null,
            price: typeof row.price === 'string' ? parseFloat(row.price) || 0 : row.price || 0,
            category: row.category || null,
            stock: typeof row.stock === 'string' ? parseInt(row.stock) || 0 : row.stock || 0,
            created_at: row.created_at || null,
          }));
          
          setProducts(productsData);
          console.log('[SimpleProducts] Loaded products:', productsData.length);
        } else {
          setProducts([]);
          console.log('[SimpleProducts] No products found in response');
        }
      } else {
        setProducts([]);
        console.log('[SimpleProducts] No products found');
      }
    } catch (error) {
      console.error('[SimpleProducts] Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!tursoDb || !newProduct.name.trim()) return;
    
    try {
      setIsLoading(true);
      
      const productData = {
        name: newProduct.name,
        description: newProduct.description || '',
        price: newProduct.price ? parseFloat(newProduct.price) || 0 : 0,
        category: newProduct.category || '',
        stock: newProduct.stock ? parseInt(newProduct.stock) || 0 : 0,
      };
      
      console.log('[SimpleProducts] Creating product:', productData);
      await tursoDb.insertIntoTable('products', productData);
      
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
      });
      
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Product created successfully!');
      
      // Refresh products list
      await loadProducts();
      
    } catch (error) {
      console.error('[SimpleProducts] Error creating product:', error);
      Alert.alert('Error', `Failed to create product: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProductCard = (product: Product, index: number) => (
    <View
      key={index}
      style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.productHeader}>
        <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          ${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
        </Text>
      </View>
      {product.description ? (
        <Text style={[styles.productDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {product.description}
        </Text>
      ) : null}
      <View style={styles.productMeta}>
        {product.category ? (
          <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
            {product.category}
          </Text>
        ) : null}
        <Text style={[styles.productStock, { color: colors.textSecondary }]}>
          Stock: {typeof product.stock === 'number' ? product.stock : 0}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Please sign in to manage products
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userAppRecord) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            Loading your app...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tursoDb) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
            Connecting to database...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol size={24} name="chevron.left" color={colors.text} />
          </TouchableOpacity>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            Products
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            <Text style={[styles.createButtonText, { color: colors.primary }]}>
              + Add Product
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Products List */}
          <View style={styles.productsSection}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : products.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="tag" color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Products Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Create your first product to start managing your inventory
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.background }]}>
                    Create Product
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.map((product, index) => renderProductCard(product, index))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Product Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Product</Text>
            <TouchableOpacity 
              onPress={handleCreateProduct} 
              disabled={!newProduct.name.trim() || isLoading}
            >
              <Text style={[styles.modalSaveText, { 
                color: newProduct.name.trim() && !isLoading ? colors.primary : colors.textSecondary 
              }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Product Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newProduct.name}
              onChangeText={(text) => setNewProduct(prev => ({...prev, name: text}))}
              placeholder="Enter product name..."
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newProduct.description}
              onChangeText={(text) => setNewProduct(prev => ({...prev, description: text}))}
              placeholder="Enter product description..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Price</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newProduct.price}
              onChangeText={(text) => setNewProduct(prev => ({...prev, price: text}))}
              placeholder="Enter price..."
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newProduct.category}
              onChangeText={(text) => setNewProduct(prev => ({...prev, category: text}))}
              placeholder="Enter category..."
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Stock</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newProduct.stock}
              onChangeText={(text) => setNewProduct(prev => ({...prev, stock: text}))}
              placeholder="Enter stock quantity..."
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: Spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: 60, // Safe area top padding
    borderBottomWidth: 0.5,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  createButton: {
    padding: Spacing.xs,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  productsSection: {
    flex: 1,
  },
  loader: {
    marginTop: Spacing['2xl'],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productsList: {
    gap: Spacing.md,
  },
  productCard: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    fontSize: 12,
    fontWeight: '500',
  },
  productStock: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
});