import { IconSymbol } from '@/components/ui/IconSymbol';
// Note: HybridDb removed - this component needs to be updated for local-first approach
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showValuesModal, setShowValuesModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LocalOpGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newValueName, setNewValueName] = useState('');
  const router = useRouter();
  const hybridDb = useHybridDb();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'surface') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  // Get groups from database
  const groups = hybridDb.getAllOpGroups();

  const filteredGroups = groups.filter(
    (group) =>
      group.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      await hybridDb.createOpGroup({ name: newGroupName.trim() });
      setNewGroupName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Create group error:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleCreateValue = async () => {
    if (!newValueName.trim() || !selectedGroup) {
      Alert.alert('Error', 'Value name is required');
      return;
    }

    try {
      await hybridDb.createOpValue({ 
        groupId: selectedGroup.id, 
        value: newValueName.trim() 
      });
      setNewValueName('');
    } catch (error) {
      console.error('Create value error:', error);
      Alert.alert('Error', 'Failed to create value');
    }
  };

  const handleSync = async () => {
    try {
      await hybridDb.syncWithInstant();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handleViewValues = (group: LocalOpGroup) => {
    setSelectedGroup(group);
    setShowValuesModal(true);
  };

  const getValueCount = (group: LocalOpGroup): number => {
    return hybridDb.getOpValuesByGroupId(group.id).length;
  };

  const renderGroup = ({ item }: { item: LocalOpGroup }) => (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: cardColor, borderColor }]}
      onPress={() => handleViewValues(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupName, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.valueCount, { backgroundColor: tintColor + '20' }]}>
            <Text style={[styles.valueCountText, { color: tintColor }]}>
              {getValueCount(item)}
            </Text>
          </View>
        </View>
        
        <View style={styles.groupStats}>
          <View style={styles.statItem}>
            <IconSymbol size={14} name="list.bullet" color={secondaryTextColor} />
            <Text style={[styles.statText, { color: secondaryTextColor }]}>
              {getValueCount(item)} values
            </Text>
          </View>
        </View>
      </View>
      
      <IconSymbol size={16} name="chevron.right" color={secondaryTextColor} />
    </TouchableOpacity>
  );

  const renderValue = ({ item }: { item: LocalOpValue }) => (
    <View style={[styles.valueItem, { borderBottomColor: borderColor }]}>
      <Text style={[styles.valueName, { color: textColor }]}>
        {item.value}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.searchContainer, { backgroundColor: borderColor + '40' }]}>
        <IconSymbol size={20} name="magnifyingglass" color={secondaryTextColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search groups..."
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
      <IconSymbol size={64} name="square.grid.3x3" color={secondaryTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No groups yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
        Tap the + button to create your first option group
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol size={24} name="chevron.left" color={tintColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Option Groups
        </Text>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleSync}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: tintColor }]}>Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.headerButton}
          >
            <IconSymbol size={20} name="plus" color={tintColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredGroups.length === 0 && styles.listContentEmpty
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Create New Group
            </Text>
            
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor }]}
              placeholder="Enter group name"
              placeholderTextColor={secondaryTextColor}
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewGroupName('');
                }}
              >
                <Text style={[styles.buttonText, { color: secondaryTextColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, { backgroundColor: tintColor }]}
                onPress={handleCreateGroup}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Values Modal */}
      <Modal
        visible={showValuesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowValuesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.valuesModalContent, { backgroundColor: cardColor }]}>
            <View style={styles.valuesHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>
                {selectedGroup?.name} Values
              </Text>
              <TouchableOpacity
                onPress={() => setShowValuesModal(false)}
                style={styles.closeButton}
              >
                <IconSymbol size={24} name="xmark" color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addValueContainer}>
              <TextInput
                style={[styles.valueInput, { color: textColor, borderColor }]}
                placeholder="Add new value"
                placeholderTextColor={secondaryTextColor}
                value={newValueName}
                onChangeText={setNewValueName}
              />
              <TouchableOpacity
                style={[styles.addValueButton, { backgroundColor: tintColor }]}
                onPress={handleCreateValue}
              >
                <IconSymbol size={16} name="plus" color="white" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={selectedGroup ? hybridDb.getOpValuesByGroupId(selectedGroup.id) : []}
              renderItem={renderValue}
              keyExtractor={(item) => item.id.toString()}
              style={styles.valuesList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
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
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupContent: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  valueCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  valueCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupStats: {
    flexDirection: 'row',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    maxWidth: 400,
  },
  valuesModalContent: {
    width: '90%',
    height: '70%',
    padding: 24,
    borderRadius: 16,
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  createButton: {
    // backgroundColor set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  valuesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  addValueContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  addValueButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuesList: {
    flex: 1,
  },
  valueItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  valueName: {
    fontSize: 16,
  },
});