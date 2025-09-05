import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
// Note: HybridDb removed - this component needs to be updated for local-first approach

export default function ItemManager() {
  const {
    // Local data
    localItems,
    localVariants,
    
    // Local operations
    createLocalItem,
    updateLocalItem,
    deleteLocalItem,
    
    // Cloud operations
    getCloudItems,
    createCloudItem,
    updateCloudItem,
    deleteCloudItem,
    
    // Refresh methods
    refreshLocalItems
  } = useHybridDb();
  
  const [items, setItems] = useState(localItems);
  const [loading, setLoading] = useState(false);
  
  // Sync local items with context
  useEffect(() => {
    setItems(localItems);
  }, [localItems]);
  
  // Create a new local item
  const handleCreateLocalItem = async () => {
    try {
      await createLocalItem({
        name: 'New Local Item',
        category: 'Local',
        optionIds: '[]'
      });
    } catch (error) {
      console.error('Error creating local item:', error);
    }
  };
  
  // Create a new cloud item
  const handleCreateCloudItem = async () => {
    try {
      const newItem = await createCloudItem({
        name: 'New Cloud Item',
        category: 'Cloud',
        optionIds: '[]'
      });
      
      if (newItem) {
        // Optionally refresh local data
        await refreshLocalItems();
      }
    } catch (error) {
      console.error('Error creating cloud item:', error);
    }
  };
  
  // Load items from cloud
  const handleLoadCloudItems = async () => {
    setLoading(true);
    try {
      const cloudItems = await getCloudItems();
      // You could set these as items or merge with local items
      setItems(cloudItems);
    } catch (error) {
      console.error('Error loading cloud items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh local items from cloud
  const handleRefreshLocalItems = async () => {
    setLoading(true);
    try {
      await refreshLocalItems();
    } catch (error) {
      console.error('Error refreshing local items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Manager</Text>
      
      <View style={styles.buttonGroup}>
        <Button title="Create Local Item" onPress={handleCreateLocalItem} />
        <Button title="Create Cloud Item" onPress={handleCreateCloudItem} />
        <Button title="Load Cloud Items" onPress={handleLoadCloudItems} />
        <Button title="Refresh Local Items" onPress={handleRefreshLocalItems} />
      </View>
      
      {loading && <Text>Loading...</Text>}
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.name}</Text>
            <Text>Category: {item.category}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});