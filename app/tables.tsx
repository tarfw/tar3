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
import { instantPlatformService } from '@/lib/instantPlatformService';
import { i } from '@instantdb/platform';

export default function TablesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, userApp, refreshUserApp } = useAuth();
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEntityDetails, setShowEntityDetails] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityFields, setNewEntityFields] = useState<Array<{name: string, type: string, required: boolean}>>([]);
  const [currentField, setCurrentField] = useState({name: '', type: 'string', required: true});

  // Load entities when component mounts or userApp changes
  useEffect(() => {
    if (userApp?.schema?.entities) {
      loadEntities();
    }
  }, [userApp]);

  const loadEntities = () => {
    if (!userApp?.schema?.entities) {
      setEntities([]);
      return;
    }

    const entitiesList = Object.entries(userApp.schema.entities).map(([name, entity]: [string, any]) => ({
      name,
      fields: getEntityFields(entity),
      entity
    }));

    setEntities(entitiesList);
    console.log('Loaded entities:', entitiesList.length);
  };

  const getEntityFields = (entity: any) => {
    if (!entity || !entity.fields) return [];
    return Object.entries(entity.fields).map(([name, field]: [string, any]) => ({
      name,
      type: field.type || 'string',
      required: !field.optional
    }));
  };

  const addFieldToEntity = () => {
    if (currentField.name.trim()) {
      setNewEntityFields(prev => [...prev, { ...currentField }]);
      setCurrentField({name: '', type: 'string', required: true});
    }
  };

  const removeField = (index: number) => {
    setNewEntityFields(prev => prev.filter((_, i) => i !== index));
  };

  const createEntity = async () => {
    if (!userApp || !newEntityName.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Create new entity schema
      const entitySchema = newEntityFields.reduce((acc, field) => {
        let fieldDef;
        switch (field.type) {
          case 'string':
            fieldDef = field.required ? i.string() : i.string().optional();
            break;
          case 'number':
            fieldDef = field.required ? i.number() : i.number().optional();
            break;
          case 'boolean':
            fieldDef = field.required ? i.boolean() : i.boolean().optional();
            break;
          case 'date':
            fieldDef = field.required ? i.date() : i.date().optional();
            break;
          default:
            fieldDef = field.required ? i.string() : i.string().optional();
        }
        acc[field.name] = fieldDef;
        return acc;
      }, {} as any);

      // Get current schema and add new entity
      const currentSchema = await instantPlatformService.getSchema(userApp.id);
      const newSchema = {
        ...currentSchema,
        entities: {
          ...currentSchema.entities,
          [newEntityName]: i.entity(entitySchema)
        }
      };

      // Push updated schema
      await instantPlatformService.schemaPush(userApp.id, newSchema);
      
      // Reset form
      setNewEntityName('');
      setNewEntityFields([]);
      setShowCreateModal(false);
      
      Alert.alert('Success', `Table "${newEntityName}" created successfully!`);
      
      // Refresh user app to get updated schema
      await refreshUserApp();
      
    } catch (error) {
      console.error('Error creating entity:', error);
      Alert.alert('Error', `Failed to create table: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const viewEntityDetails = (entity: any) => {
    setSelectedEntity(entity);
    setShowEntityDetails(true);
  };

  const renderEntityCard = (entity: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.entityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => viewEntityDetails(entity)}
      activeOpacity={0.7}
    >
      <View style={styles.entityHeader}>
        <View style={[styles.entityIcon, { backgroundColor: `${colors.primary}20` }]}>
          <IconSymbol size={20} name="square.grid.3x3" color={colors.primary} />
        </View>
        <View style={styles.entityInfo}>
          <Text style={[styles.entityName, { color: colors.text }]}>{entity.name}</Text>
          <Text style={[styles.entityFieldCount, { color: colors.textSecondary }]}>
            {entity.fields.length} field{entity.fields.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <IconSymbol size={16} name="chevron.right" color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const renderFieldRow = (field: any, index: number) => (
    <View key={index} style={styles.fieldRow}>
      <Text style={[styles.fieldName, { color: colors.text }]}>{field.name}</Text>
      <View style={styles.fieldMeta}>
        <Text style={[styles.fieldType, { color: colors.primary }]}>{field.type}</Text>
        {field.required && (
          <Text style={[styles.requiredBadge, { color: colors.warning }]}>Required</Text>
        )}
      </View>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Please sign in to manage tables
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userApp) {
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
            Tables
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            <Text style={[styles.createButtonText, { color: colors.primary }]}>
              + Add Table
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          {/* Entities List */}
          <View style={styles.entitiesSection}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : entities.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol size={48} name="square.grid.3x3" color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Tables Yet</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Create your first table to start organizing your data
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.emptyButtonText, { color: colors.background }]}>
                    Create Table
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.entitiesList}>
                {entities.map((entity, index) => renderEntityCard(entity, index))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create Entity Modal */}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create Table</Text>
            <TouchableOpacity onPress={createEntity} disabled={!newEntityName.trim() || isLoading}>
              <Text style={[styles.modalSaveText, { 
                color: newEntityName.trim() && !isLoading ? colors.primary : colors.textSecondary 
              }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Table Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newEntityName}
              onChangeText={setNewEntityName}
              placeholder="Enter table name..."
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Fields</Text>
            
            {/* Current Fields */}
            {newEntityFields.map((field, index) => (
              <View key={index} style={[styles.fieldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.fieldInfo}>
                  <Text style={[styles.fieldName, { color: colors.text }]}>{field.name}</Text>
                  <Text style={[styles.fieldType, { color: colors.primary }]}>
                    {field.type}{field.required ? '' : '?'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeField(index)}>
                  <Text style={[styles.removeFieldText, { color: '#ef4444' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            
            {/* Add New Field */}
            <View style={[styles.addFieldSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Add Field</Text>
              
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={currentField.name}
                onChangeText={(text) => setCurrentField(prev => ({...prev, name: text}))}
                placeholder="Field name..."
                placeholderTextColor={colors.textSecondary}
              />
              
              <View style={styles.fieldTypeRow}>
                {['string', 'number', 'boolean', 'date'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { 
                        backgroundColor: currentField.type === type ? colors.primary : colors.background,
                        borderColor: colors.border 
                      }
                    ]}
                    onPress={() => setCurrentField(prev => ({...prev, type}))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: currentField.type === type ? colors.background : colors.text }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={[styles.requiredToggle, { borderColor: colors.border }]}
                onPress={() => setCurrentField(prev => ({...prev, required: !prev.required}))}
              >
                <Text style={[styles.requiredText, { color: colors.text }]}>
                  Required: {currentField.required ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addFieldButton, { backgroundColor: colors.primary }]}
                onPress={addFieldToEntity}
                disabled={!currentField.name.trim()}
              >
                <Text style={[styles.addFieldButtonText, { color: colors.background }]}>
                  Add Field
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Entity Details Modal */}
      <Modal
        visible={showEntityDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowEntityDetails(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Table Details</Text>
            <View style={{ width: 60 }} />
          </View>
          
          {selectedEntity && (
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Table Name</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{selectedEntity.name}</Text>
              
              <Text style={[styles.detailLabel, { color: colors.text }]}>Fields ({selectedEntity.fields.length})</Text>
              {selectedEntity.fields.map((field: any, index: number) => renderFieldRow(field, index))}
            </ScrollView>
          )}
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
  entitiesSection: {
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
  entitiesList: {
    gap: Spacing.md,
  },
  entityCard: {
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  entityFieldCount: {
    fontSize: 14,
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
  
  // Field Management
  fieldCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  fieldMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fieldType: {
    fontSize: 12,
    fontWeight: '500',
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '600',
  },
  removeFieldText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addFieldSection: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  fieldTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requiredToggle: {
    padding: Spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  requiredText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addFieldButton: {
    paddingVertical: Spacing.md,
    borderRadius: 6,
    alignItems: 'center',
  },
  addFieldButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Details
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
});