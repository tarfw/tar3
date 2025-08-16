import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DataService } from '@/lib/dataService';
import { db } from '@/lib/instant';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Linear's exact priority system
const PRIORITIES = [
  { 
    value: 1, 
    label: 'Urgent', 
    icon: 'exclamationmark.triangle.fill', 
    color: '#F56565',
    description: 'This is blocking'
  },
  { 
    value: 2, 
    label: 'High', 
    icon: 'arrow.up', 
    color: '#ED8936',
    description: 'Important'
  },
  { 
    value: 3, 
    label: 'Medium', 
    icon: 'minus', 
    color: '#4A5568',
    description: 'Normal priority'
  },
  { 
    value: 4, 
    label: 'Low', 
    icon: 'arrow.down', 
    color: '#A0AEC0',
    description: 'Nice to have'
  },
];

export default function CreateIssueScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Use InstantDB's useLocalId for consistent user identification
  const localUserId = db.useLocalId();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPriority, setSelectedPriority] = useState(3); // Medium by default
  const [isCreating, setIsCreating] = useState(false);

  // Get project data for context
  // No need for complex project queries in simplified schema

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an issue title');
      return;
    }

    setIsCreating(true);
    
    try {
      await DataService.createIssue({
        title: title.trim(),
        description: description.trim(),
        creatorId: localUserId || 'anonymous-user',
        priority: selectedPriority,
      });

      Alert.alert('Success', 'Issue created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating issue:', error);
      Alert.alert('Error', 'Failed to create issue. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const renderPriorityOption = (priority: typeof PRIORITIES[0]) => {
    const isSelected = selectedPriority === priority.value;
    
    return (
      <TouchableOpacity
        key={priority.value}
        onPress={() => setSelectedPriority(priority.value)}
        style={[
          styles.priorityOption,
          { 
            backgroundColor: isSelected ? `${priority.color}20` : colors.backgroundSecondary,
            borderColor: isSelected ? priority.color : 'transparent',
          }
        ]}
      >
        <IconSymbol 
          size={16} 
          name={priority.icon} 
          color={isSelected ? priority.color : colors.iconSecondary} 
        />
        <Text style={[
          TextStyles.label, 
          { 
            color: isSelected ? priority.color : colors.text,
            marginLeft: Spacing.sm 
          }
        ]}>
          {priority.label}
        </Text>
        {isSelected && (
          <IconSymbol 
            size={16} 
            name="checkmark" 
            color={priority.color}
            style={{ marginLeft: 'auto' }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={[TextStyles.button, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[TextStyles.label, { color: colors.text, flex: 1, textAlign: 'center' }]}>
          New Issue
        </Text>
        <TouchableOpacity 
          onPress={handleCreate} 
          style={[
            styles.createButton, 
            { backgroundColor: title.trim() ? colors.primary : colors.backgroundTertiary }
          ]}
          disabled={!title.trim() || isCreating}
        >
          <Text style={[
            TextStyles.buttonSmall, 
            { color: title.trim() ? colors.textInverse : colors.textTertiary }
          ]}>
            {isCreating ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* Issue Details */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.field}>
              <Text style={[TextStyles.label, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                autoCapitalize="sentences"
                maxLength={100}
                multiline
              />
            </View>

            <View style={styles.field}>
              <Text style={[TextStyles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Add more details about this issue..."
                placeholderTextColor={colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Priority Selection */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[TextStyles.label, { color: colors.text, marginBottom: Spacing.md }]}>
              Priority
            </Text>
            <View style={styles.priorityGrid}>
              {PRIORITIES.map(renderPriorityOption)}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[TextStyles.label, { color: colors.text, marginBottom: Spacing.md }]}>
              Quick Actions
            </Text>
            
            <TouchableOpacity style={styles.quickAction}>
              <IconSymbol size={20} name="person" color={colors.iconSecondary} />
              <Text style={[TextStyles.body, { color: colors.textSecondary, marginLeft: Spacing.md }]}>
                Assign to someone
              </Text>
              <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <IconSymbol size={20} name="tag" color={colors.iconSecondary} />
              <Text style={[TextStyles.body, { color: colors.textSecondary, marginLeft: Spacing.md }]}>
                Add labels
              </Text>
              <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAction}>
              <IconSymbol size={20} name="calendar" color={colors.iconSecondary} />
              <Text style={[TextStyles.body, { color: colors.textSecondary, marginLeft: Spacing.md }]}>
                Set due date
              </Text>
              <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    ...Shadow.sm,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
  createButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  scrollContainer: {
    paddingBottom: Spacing['2xl'],
  },
  section: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  projectContext: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  projectIconText: {
    fontSize: 18,
  },
  projectInfo: {
    flex: 1,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    ...TextStyles.body,
    marginTop: Spacing.sm,
    minHeight: 44,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    ...TextStyles.body,
    marginTop: Spacing.sm,
    minHeight: 100,
  },
  priorityGrid: {
    gap: Spacing.sm,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
});
