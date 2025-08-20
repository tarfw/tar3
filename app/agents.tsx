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
import { 
  instantPlatformService, 
  InstantPlatformService,
  type InstantApp
} from '@/lib/instantPlatformService';
import { i } from '@instantdb/platform';
import { db, id } from '@/lib/instant';
import { useAuth } from '@/contexts/AuthContext';

export default function AgentsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  
  // State management
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userApp, setUserApp] = useState<InstantApp | null>(null);
  const [userAppRecord, setUserAppRecord] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [showAppDetails, setShowAppDetails] = useState(false);
  const [appTemplate, setAppTemplate] = useState<'todo' | 'chat' | 'custom'>('todo');
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityFields, setNewEntityFields] = useState<Array<{name: string, type: string, required: boolean}>>([]);
  const [currentField, setCurrentField] = useState({name: '', type: 'string', required: true});

  // Query user's app from the database - include linked users
  const { data: userData, isLoading: isLoadingUserData, error: userDataError } = db.useQuery(
    user?.id ? {
      app: {
        $users: {}
      }
    } : null
  );


  // Initialize with platform token on mount
  useEffect(() => {
    initializePlatformToken();
  }, []);

  // Load user's app when token is available and user data is loaded
  useEffect(() => {
    if (accessToken && instantPlatformService.isInitialized() && !isLoadingUserData && user?.id) {
      loadUserApp();
    }
  }, [accessToken, userData, isLoadingUserData, user?.id]);

  const initializePlatformToken = async () => {
    try {
      // Get platform token from environment variable
      const platformToken = process.env.EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN;
      
      if (!platformToken) {
        console.error('EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN environment variable is not set');
        return;
      }
      
      await instantPlatformService.saveToken(platformToken);
      setAccessToken(platformToken);
    } catch (error) {
      console.error('Error initializing platform token:', error);
    }
  };

  const saveToken = async (token: string) => {
    try {
      await instantPlatformService.saveToken(token);
      setAccessToken(token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const refreshUserApp = async () => {
    await loadUserApp();
  };

  const loadUserApp = async () => {
    if (!instantPlatformService.isInitialized() || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Get user's app record from the database
      // Filter apps to find the one linked to current user
      const userAppData = userData?.app?.find(app => 
        app.$users?.some(u => u.id === user.id)
      );
      setUserAppRecord(userAppData);
      
      if (userAppData?.appid) {
        // Load the specific app from platform API
        const apps = await instantPlatformService.getApps({ 
          includeSchema: true, 
          includePerms: true 
        });
        
        // Find the user's specific app
        const foundApp = apps.find(app => app.id === userAppData.appid);
        setUserApp(foundApp || null);
      } else {
        setUserApp(null);
      }
    } catch (error) {
      console.error('Error loading user agent:', error);
      Alert.alert('Error', `Failed to load your agent: ${error.message}`);
      setUserApp(null);
    } finally {
      setIsLoading(false);
    }
  };

  const createApp = async () => {
    if (!instantPlatformService.isInitialized() || !newAppTitle.trim() || !user) return;
    
    // Check if user already has an app
    if (userApp || userAppRecord?.appid) {
      Alert.alert(
        'Limit Reached', 
        'You can only create one app. You can add unlimited agents to your existing app.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get schema and permissions based on template
      let schema, perms;
      
      switch (appTemplate) {
        case 'todo':
          schema = InstantPlatformService.createBasicTodoSchema();
          perms = InstantPlatformService.createBasicTodoPermissions();
          break;
        case 'chat':
          schema = InstantPlatformService.createChatAppSchema();
          perms = InstantPlatformService.createChatAppPermissions();
          break;
        case 'custom':
        default:
          // Basic custom schema
          schema = undefined;
          perms = undefined;
          break;
      }

      // Create real app via API
      const newApp = await instantPlatformService.createApp({
        title: newAppTitle,
        schema,
        perms,
      });
      
      // Store the app ID in the user's app record
      const appRecordId = userAppRecord?.id || id();
      await db.transact([
        db.tx.app[appRecordId].update({
          appid: newApp.id
        }).link({ $users: user.id })
      ]);
      
      
      setUserApp(newApp);
      Alert.alert('Success', `App "${newAppTitle}" created successfully! You can now add unlimited agents to your app.`);
      
      // Refresh the user's app data
      await refreshUserApp();
      
      setNewAppTitle('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      Alert.alert('Error', 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApp = async () => {
    if (!instantPlatformService.isInitialized() || !userApp || !userAppRecord) return;
    
    Alert.alert(
      'Delete App',
      'Are you sure you want to delete this app? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Delete via API
              await instantPlatformService.deleteApp(userApp.id);
              
              // Remove app ID from user's record
              await db.transact([
                db.tx.app[userAppRecord.id].update({
                  appid: null
                })
              ]);
              
              setUserApp(null);
              Alert.alert('Success', 'App deleted successfully');
              
              // Refresh the user's app data
              await refreshUserApp();
            } catch (error) {
              console.error('Error deleting agent:', error);
              Alert.alert('Error', `Failed to delete agent: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const logout = async () => {
    try {
      await instantPlatformService.clearToken();
      setAccessToken(null);
      setUserApp(null);
      setUserAppRecord(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
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

  const createCustomEntity = async () => {
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
      setShowAddEntity(false);
      
      Alert.alert('Success', `Agent "${newEntityName}" added successfully!`);
      
      // Refresh user app to get updated schema
      await refreshUserApp();
    } catch (error) {
      console.error('Error creating entity:', error);
      Alert.alert('Error', `Failed to create entity: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityFields = (entity: any) => {
    if (!entity || !entity.fields) return [];
    return Object.entries(entity.fields).map(([name, field]: [string, any]) => ({
      name,
      type: field.type || 'string',
      required: !field.optional
    }));
  };

  const renderUserAppCard = () => {
    if (!userApp) return null;
    
    return (
      <View style={[styles.appCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.appCardHeader}>
          <Text style={[styles.appTitle, { color: colors.text }]}>{userApp.title}</Text>
          <View style={styles.appActions}>
            <TouchableOpacity
              onPress={() => setShowAppDetails(true)}
              style={styles.actionButton}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteApp()}
              style={styles.actionButton}
            >
              <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.appDate, { color: colors.textSecondary }]}>
          Created: {new Date(userApp.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            My Agents
          </Text>
          {accessToken && !userApp && (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
            >
              <Text style={[styles.createButtonText, { color: colors.primary }]}>
                + Create App
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          {!accessToken ? (
            // Loading Section
            <View style={styles.loginSection}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.title, { color: colors.text, marginTop: Spacing.lg }]}>
                Initializing App
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Setting up your app for agents...
              </Text>
            </View>
          ) : (
            // User App Section
            <View style={styles.appsSection}>
              {isLoading || isLoadingUserData ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
              ) : !userApp ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No app found. Create your app to get started! You can then add unlimited agents as entities.
                  </Text>
                </View>
              ) : (
                <View style={styles.appsList}>
                  {renderUserAppCard()}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create App Modal */}
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
            <Text style={[styles.modalTitle, { color: colors.text }]}>Create New App</Text>
            <TouchableOpacity onPress={createApp} disabled={!newAppTitle.trim() || isLoading}>
              <Text style={[styles.modalSaveText, { 
                color: newAppTitle.trim() && !isLoading ? colors.primary : colors.textSecondary 
              }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>App Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newAppTitle}
              onChangeText={setNewAppTitle}
              placeholder="Enter app name..."
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>App Template</Text>
            <View style={styles.templateSelector}>
              <TouchableOpacity
                style={[
                  styles.templateOption,
                  { 
                    backgroundColor: appTemplate === 'todo' ? colors.primary : colors.card,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setAppTemplate('todo')}
              >
                <Text style={[
                  styles.templateOptionText,
                  { color: appTemplate === 'todo' ? colors.background : colors.text }
                ]}>
                  📝 Task App
                </Text>
                <Text style={[
                  styles.templateDescription,
                  { color: appTemplate === 'todo' ? colors.background : colors.textSecondary }
                ]}>
                  App for task management agents
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.templateOption,
                  { 
                    backgroundColor: appTemplate === 'chat' ? colors.primary : colors.card,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setAppTemplate('chat')}
              >
                <Text style={[
                  styles.templateOptionText,
                  { color: appTemplate === 'chat' ? colors.background : colors.text }
                ]}>
                  💬 Chat App
                </Text>
                <Text style={[
                  styles.templateDescription,
                  { color: appTemplate === 'chat' ? colors.background : colors.textSecondary }
                ]}>
                  App for chat and messaging agents
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.templateOption,
                  { 
                    backgroundColor: appTemplate === 'custom' ? colors.primary : colors.card,
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setAppTemplate('custom')}
              >
                <Text style={[
                  styles.templateOptionText,
                  { color: appTemplate === 'custom' ? colors.background : colors.text }
                ]}>
                  🛠️ Custom App
                </Text>
                <Text style={[
                  styles.templateDescription,
                  { color: appTemplate === 'custom' ? colors.background : colors.textSecondary }
                ]}>
                  Build your own app for custom agents
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {appTemplate === 'todo' && 'Creates an app with task management entities (todos, users) for building task-related agents.'}
              {appTemplate === 'chat' && 'Creates an app with messaging entities (messages, channels, users) for building chat agents.'}
              {appTemplate === 'custom' && 'Creates a blank app where you can add your own entities to build custom agents.'}
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* App Details Modal */}
      <Modal
        visible={showAppDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAppDetails(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>App Details</Text>
            <TouchableOpacity onPress={() => setShowAddEntity(true)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>+ Agent</Text>
            </TouchableOpacity>
          </View>
          
          {userApp && (
            <ScrollView style={styles.modalContent}>
              <Text style={[styles.detailLabel, { color: colors.text }]}>App Name</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{userApp.title}</Text>
              
              <Text style={[styles.detailLabel, { color: colors.text }]}>App ID</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>{userApp.id}</Text>
              
              <Text style={[styles.detailLabel, { color: colors.text }]}>Created</Text>
              <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                {new Date(userApp.createdAt).toLocaleString()}
              </Text>
              
              {userApp.schema && userApp.schema.entities && (
                <>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>Agents</Text>
                  {Object.entries(userApp.schema.entities).map(([entityName, entity]: [string, any]) => (
                    <View key={entityName} style={[styles.entityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.entityName, { color: colors.text }]}>{entityName}</Text>
                      {getEntityFields(entity).map((field, index) => (
                        <View key={index} style={styles.fieldRow}>
                          <Text style={[styles.fieldName, { color: colors.textSecondary }]}>
                            {field.name}
                          </Text>
                          <Text style={[styles.fieldType, { color: colors.primary }]}>
                            {field.type}{field.required ? '' : '?'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </>
              )}
              
              {userApp.perms && (
                <>
                  <Text style={[styles.detailLabel, { color: colors.text }]}>Permissions</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    Custom permissions configured for data access control
                  </Text>
                </>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Add Entity Modal */}
      <Modal
        visible={showAddEntity}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAddEntity(false)}>
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Agent</Text>
            <TouchableOpacity onPress={createCustomEntity} disabled={!newEntityName.trim() || isLoading}>
              <Text style={[styles.modalSaveText, { 
                color: newEntityName.trim() && !isLoading ? colors.primary : colors.textSecondary 
              }]}>
                Create
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Agent Name</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              value={newEntityName}
              onChangeText={setNewEntityName}
              placeholder="Enter agent name..."
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
    </SafeAreaView>
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
    borderBottomWidth: 0.5,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  
  // Login Section
  loginSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
  },
  loginButton: {
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Apps Section
  appsSection: {
    flex: 1,
  },
  createButton: {
    padding: Spacing.xs,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  appsList: {
    gap: Spacing.md,
  },
  
  // App Card
  appCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  appActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  appDate: {
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
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  
  // Template Selector
  templateSelector: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  templateOption: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  templateOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  templateDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  
  // App Details
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  // Entity Display
  entityCard: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  entityName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  fieldName: {
    fontSize: 14,
    flex: 1,
  },
  fieldType: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Add Entity Form
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
});