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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityFields, setNewEntityFields] = useState<Array<{name: string, type: string, required: boolean}>>([]);
  const [currentField, setCurrentField] = useState({name: '', type: 'string', required: true});
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [editingFields, setEditingFields] = useState<Array<{name: string, type: string, required: boolean, isNew?: boolean}>>([]);
  const [editingField, setEditingField] = useState({name: '', type: 'string', required: true});
  const [editFieldIndex, setEditFieldIndex] = useState<number | null>(null);

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

    const entitiesList = Object.entries(userApp.schema.entities).map(([name, entity]: [string, any]) => {
      console.log(`Entity "${name}" structure:`, JSON.stringify(entity, null, 2));
      const fields = getEntityFields(entity);
      console.log(`Entity "${name}" extracted fields:`, fields);
      
      return {
        name,
        fields,
        entity
      };
    });

    setEntities(entitiesList);
    console.log('Loaded entities:', entitiesList.length);
  };

  const getEntityFields = (entity: any) => {
    if (!entity) return [];
    
    // Handle different possible schema structures
    let fields = {};
    
    if (entity.fields) {
      // If fields are nested under a fields property
      fields = entity.fields;
    } else if (entity.attrs) {
      // If fields are stored as attrs (InstantDB internal structure)
      fields = entity.attrs;
    } else if (typeof entity === 'object') {
      // If the entity itself contains the field definitions
      fields = entity;
    }
    
    if (!fields || typeof fields !== 'object') return [];
    
    return Object.entries(fields).map(([name, field]: [string, any]) => {
      // Handle different field definition structures
      let type = 'string';
      let required = true;
      
      if (field && typeof field === 'object') {
        // Check for type information
        if (field.type) {
          type = field.type;
        } else if (field.cardinality) {
          // InstantDB internal structure
          switch (field.cardinality) {
            case 'one':
              type = field.valueType || 'string';
              break;
            default:
              type = 'string';
          }
        }
        
        // Check for optional/required status
        if (field.hasOwnProperty('optional')) {
          required = !field.optional;
        } else if (field.hasOwnProperty('required')) {
          required = field.required;
        }
      }
      
      return {
        name,
        type,
        required
      };
    });
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

  const editEntity = (entity: any) => {
    setEditingEntity(entity);
    setEditingFields([...entity.fields]);
    setShowEntityDetails(false);
    setShowEditModal(true);
  };

  const addFieldToEditingEntity = () => {
    if (editingField.name.trim()) {
      setEditingFields(prev => [...prev, { ...editingField, isNew: true }]);
      setEditingField({name: '', type: 'string', required: true});
    }
  };

  const removeFieldFromEditingEntity = (index: number) => {
    setEditingFields(prev => prev.filter((_, i) => i !== index));
  };

  const startEditField = (index: number) => {
    const field = editingFields[index];
    setEditingField({ name: field.name, type: field.type, required: field.required });
    setEditFieldIndex(index);
  };

  const saveEditField = () => {
    if (editFieldIndex !== null && editingField.name.trim()) {
      setEditingFields(prev => prev.map((field, index) => 
        index === editFieldIndex ? { ...editingField } : field
      ));
      setEditFieldIndex(null);
      setEditingField({name: '', type: 'string', required: true});
    }
  };

  const cancelEditField = () => {
    setEditFieldIndex(null);
    setEditingField({name: '', type: 'string', required: true});
  };

  const updateEntity = async () => {
    if (!userApp || !editingEntity) return;
    
    try {
      setIsLoading(true);
      
      // Create updated entity schema
      const entitySchema = editingFields.reduce((acc, field) => {
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

      // Get current schema and update entity
      const currentSchema = await instantPlatformService.getSchema(userApp.id);
      const newSchema = {
        ...currentSchema,
        entities: {
          ...currentSchema.entities,
          [editingEntity.name]: i.entity(entitySchema)
        }
      };

      // Push updated schema
      await instantPlatformService.schemaPush(userApp.id, newSchema);
      
      // Reset form
      setEditingEntity(null);
      setEditingFields([]);
      setShowEditModal(false);
      
      Alert.alert('Success', `Table "${editingEntity.name}" updated successfully!`);
      
      // Refresh user app to get updated schema
      await refreshUserApp();
      
    } catch (error) {
      console.error('Error updating entity:', error);
      Alert.alert('Error', `Failed to update table: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEntity = async (entityName: string) => {
    if (!userApp) return;
    
    Alert.alert(
      'Delete Table',
      `Are you sure you want to delete the table "${entityName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Get current schema and remove entity
              const currentSchema = await instantPlatformService.getSchema(userApp.id);
              const newEntities = { ...currentSchema.entities };
              delete newEntities[entityName];
              
              const newSchema = {
                ...currentSchema,
                entities: newEntities
              };

              // Push updated schema
              await instantPlatformService.schemaPush(userApp.id, newSchema);
              
              Alert.alert('Success', `Table "${entityName}" deleted successfully!`);
              
              // Refresh user app to get updated schema
              await refreshUserApp();
              setShowEntityDetails(false);
              
            } catch (error) {
              console.error('Error deleting entity:', error);
              Alert.alert('Error', `Failed to delete table: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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

  const renderFieldRow = (field: any, index: number, showActions: boolean = false) => (
    <View key={index} style={styles.fieldRow}>
      <View style={styles.fieldInfo}>
        <Text style={[styles.fieldName, { color: colors.text }]}>{field.name}</Text>
        <View style={styles.fieldMeta}>
          <Text style={[styles.fieldType, { color: colors.primary }]}>{field.type}</Text>
          {field.required && (
            <Text style={[styles.requiredBadge, { color: colors.warning }]}>Required</Text>
          )}
        </View>
      </View>
      {showActions && (
        <View style={styles.fieldActions}>
          <TouchableOpacity 
            onPress={() => startEditField(index)}
            style={styles.fieldActionButton}
          >
            <Text style={[styles.fieldActionText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => removeFieldFromEditingEntity(index)}
            style={styles.fieldActionButton}
          >
            <Text style={[styles.fieldActionText, { color: '#ef4444' }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
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
            <TouchableOpacity onPress={() => selectedEntity && editEntity(selectedEntity)}>
              <Text style={[styles.modalSaveText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          {selectedEntity && (
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>Table Name</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{selectedEntity.name}</Text>
              
              <Text style={[styles.detailLabel, { color: colors.text }]}>Fields ({selectedEntity.fields.length})</Text>
              {selectedEntity.fields.map((field: any, index: number) => renderFieldRow(field, index))}
              
              <TouchableOpacity
                onPress={() => deleteEntity(selectedEntity.name)}
                style={[styles.deleteButton, { backgroundColor: '#ef4444' }]}
              >
                <Text style={[styles.deleteButtonText, { color: 'white' }]}>
                  Delete Table
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Entity Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Table</Text>
            <TouchableOpacity onPress={updateEntity} disabled={isLoading}>
              <Text style={[styles.modalSaveText, { 
                color: !isLoading ? colors.primary : colors.textSecondary 
              }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {editingEntity && (
              <>
                <Text style={[styles.detailLabel, { color: colors.text }]}>Table Name</Text>
                <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{editingEntity.name}</Text>
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Fields</Text>
                
                {/* Current Fields */}
                {editingFields.map((field, index) => (
                  <View key={index}>
                    {editFieldIndex === index ? (
                      // Edit field form
                      <View style={[styles.editFieldSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Edit Field</Text>
                        
                        <TextInput
                          style={[styles.textInput, { 
                            backgroundColor: colors.background, 
                            borderColor: colors.border,
                            color: colors.text 
                          }]}
                          value={editingField.name}
                          onChangeText={(text) => setEditingField(prev => ({...prev, name: text}))}
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
                                  backgroundColor: editingField.type === type ? colors.primary : colors.background,
                                  borderColor: colors.border 
                                }
                              ]}
                              onPress={() => setEditingField(prev => ({...prev, type}))}
                            >
                              <Text style={[
                                styles.typeButtonText,
                                { color: editingField.type === type ? colors.background : colors.text }
                              ]}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        
                        <TouchableOpacity
                          style={[styles.requiredToggle, { borderColor: colors.border }]}
                          onPress={() => setEditingField(prev => ({...prev, required: !prev.required}))}
                        >
                          <Text style={[styles.requiredText, { color: colors.text }]}>
                            Required: {editingField.required ? 'Yes' : 'No'}
                          </Text>
                        </TouchableOpacity>
                        
                        <View style={styles.editFieldActions}>
                          <TouchableOpacity
                            style={[styles.editFieldButton, { backgroundColor: colors.primary }]}
                            onPress={saveEditField}
                            disabled={!editingField.name.trim()}
                          >
                            <Text style={[styles.editFieldButtonText, { color: colors.background }]}>
                              Save
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.editFieldButton, { backgroundColor: colors.textSecondary }]}
                            onPress={cancelEditField}
                          >
                            <Text style={[styles.editFieldButtonText, { color: colors.background }]}>
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      // Display field with actions
                      renderFieldRow(field, index, true)
                    )}
                  </View>
                ))}
                
                {/* Add New Field */}
                <View style={[styles.addFieldSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Add New Field</Text>
                  
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.background, 
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={editingField.name}
                    onChangeText={(text) => setEditingField(prev => ({...prev, name: text}))}
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
                            backgroundColor: editingField.type === type ? colors.primary : colors.background,
                            borderColor: colors.border 
                          }
                        ]}
                        onPress={() => setEditingField(prev => ({...prev, type}))}
                      >
                        <Text style={[
                          styles.typeButtonText,
                          { color: editingField.type === type ? colors.background : colors.text }
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.requiredToggle, { borderColor: colors.border }]}
                    onPress={() => setEditingField(prev => ({...prev, required: !prev.required}))}
                  >
                    <Text style={[styles.requiredText, { color: colors.text }]}>
                      Required: {editingField.required ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.addFieldButton, { backgroundColor: colors.primary }]}
                    onPress={addFieldToEditingEntity}
                    disabled={!editingField.name.trim()}
                  >
                    <Text style={[styles.addFieldButtonText, { color: colors.background }]}>
                      Add Field
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  fieldActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fieldActionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  fieldActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  editFieldSection: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  editFieldActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  editFieldButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
  },
  editFieldButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});