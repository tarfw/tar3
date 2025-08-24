import { IconSymbol } from '@/components/ui/IconSymbol';
import NotionBlockEditor, { Block, BlockType, NotionBlockEditorMethods } from '@/components/ui/NotionBlockEditor';
import NotionToolbar from '@/components/ui/NotionToolbar';
import { Colors } from '@/constants/Colors';
import { Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Post {
  id: string;
  title: string;
  content: Block[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export default function PostsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const editorRef = useRef<NotionBlockEditorMethods>(null);
  
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([
    { id: Date.now().toString(), type: 'text', content: '' }
  ]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [saving, setSaving] = useState(false);

  const handleBlocksChange = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    if (!title.trim() && blocks.length === 0) {
      Alert.alert('Empty Post', 'Please add a title or content before saving.');
      return;
    }

    setSaving(true);
    try {
      // TODO: Implement actual save logic with your data service
      const post: Post = {
        id: Date.now().toString(),
        title: title.trim() || 'Untitled',
        content: blocks,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      };
      
      console.log('Saving post:', post);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Post Saved',
        `Your post has been saved as ${status}.`,
        [
          {
            text: 'Continue Editing',
            style: 'cancel'
          },
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('Error', 'Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = () => {
    setStatus(prev => prev === 'draft' ? 'published' : 'draft');
  };

  const handleAddBlock = (type?: BlockType) => {
    // Add a new block of the specified type (defaults to text if no type provided)
    editorRef.current?.addBlock(type || 'text');
  };

  const handleImageInsert = (imageUrl: string, imageName: string, imageKey?: string) => {
    editorRef.current?.addImageBlock(imageUrl, imageName, imageKey);
  };

  const handleUndo = () => {
    editorRef.current?.undo();
  };

  const getStatusColor = () => {
    return status === 'published' ? '#10b981' : '#f59e0b';
  };

  const getStatusText = () => {
    return status === 'published' ? 'Published' : 'Draft';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <IconSymbol size={24} name="chevron.left" color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={[TextStyles.h4, { color: colors.text }]}>New Post</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleStatusToggle}
            style={[styles.statusButton, { backgroundColor: `${getStatusColor()}20` }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, { color: colors.background }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Title Input */}
        <View style={[styles.titleContainer, { borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Post title..."
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            multiline={false}
            maxLength={100}
          />
        </View>

        {/* Editor Container */}
        <KeyboardAvoidingView 
          style={styles.editorContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <NotionBlockEditor
            ref={editorRef}
            placeholder="Start writing your post..."
            autoFocus={false}
            onBlocksChange={handleBlocksChange}
          />
        </KeyboardAvoidingView>

        {/* Toolbar */}
        <View style={[styles.toolbarContainer, { paddingBottom: insets.bottom, backgroundColor: colors.background }]}>
          <NotionToolbar
            onAddBlock={handleAddBlock}
            onImageInsert={handleImageInsert}
            onUndo={handleUndo}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    backgroundColor: 'transparent',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    minHeight: 44,
    paddingVertical: 0,
  },
  editorContainer: {
    flex: 1,
    paddingBottom: 80, // Space for toolbar
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: 0, // Will be handled by safe area
  },
});