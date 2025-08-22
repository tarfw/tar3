import { IconSymbol } from '@/components/ui/IconSymbol';
import NotionBlockEditor, { Block, NotionBlockEditorMethods } from '@/components/ui/NotionBlockEditor';
import NotionToolbar from '@/components/ui/NotionToolbar';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { db, id } from '@/lib/instant';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
}

export default function PostsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const editorRef = useRef<NotionBlockEditorMethods>(null);
  
  // State management
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    tags: '',
    status: 'draft' as Post['status']
  });
  const [editorBlocks, setEditorBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Post['status']>('all');

  // Query posts from the database
  const { data: postsData, isLoading: isLoadingPosts, error: postsError } = db.useQuery(
    user?.id ? {
      posts: {
        $: {
          where: {
            author: user.id
          }
        }
      }
    } : null
  );

  useEffect(() => {
    if (postsData?.posts) {
      setPosts(postsData.posts as Post[]);
    }
  }, [postsData]);

  const createPost = async () => {
    // Extract title and content from blocks
    const titleBlock = editorBlocks.find(block => block.type === 'title');
    const contentBlocks = editorBlocks.filter(block => block.type !== 'title' && block.content.trim());
    
    const title = titleBlock?.content.trim() || '';
    const content = contentBlocks.map(block => {
      const prefix = block.type === 'bullet' ? '• ' : 
                    block.type === 'task' ? '☐ ' :
                    block.type === 'quote' ? '> ' :
                    block.type.startsWith('heading') ? `${'#'.repeat(parseInt(block.type.slice(-1)))} ` : '';
      return prefix + block.content;
    }).join('\n\n');

    if (!title || !user?.id) {
      Alert.alert('Error', 'Please add a title to your post');
      return;
    }

    try {
      setIsLoading(true);
      
      const postId = id();
      const tags = newPost.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await db.transact([
        db.tx.posts[postId].update({
          title,
          content: content || 'No content',
          author: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: tags,
          status: newPost.status
        })
      ]);

      // Reset form
      setNewPost({
        title: '',
        content: '',
        tags: '',
        status: 'draft'
      });
      setEditorBlocks([]);
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await db.transact([
                db.tx.posts[postId].delete()
              ]);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const updatePostStatus = async (postId: string, status: Post['status']) => {
    try {
      setIsLoading(true);
      await db.transact([
        db.tx.posts[postId].update({
          status,
          updatedAt: new Date().toISOString()
        })
      ]);
      Alert.alert('Success', `Post ${status} successfully`);
    } catch (error) {
      console.error('Error updating post status:', error);
      Alert.alert('Error', 'Failed to update post status');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'archived': return '#6b7280';
      default: return colors.textSecondary;
    }
  };

  const renderPostCard = (post: Post) => (
    <View key={post.id} style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={styles.postTitleContainer}>
          <Text style={[styles.postTitle, { color: colors.text }]} numberOfLines={2}>
            {post.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(post.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(post.status) }]}>
              {post.status}
            </Text>
          </View>
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity
            onPress={() => router.push(`/post/${post.id}` as any)}
            style={styles.actionButton}
          >
            <IconSymbol size={18} name="eye" color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deletePost(post.id)}
            style={styles.actionButton}
          >
            <IconSymbol size={18} name="trash" color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
        {post.content}
      </Text>
      
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: colors.backgroundElevated }]}>
              <Text style={[styles.tagText, { color: colors.text }]}>#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>
              +{post.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.postFooter}>
        <Text style={[styles.postDate, { color: colors.textSecondary }]}>
          {new Date(post.createdAt).toLocaleDateString()}
        </Text>
        <View style={styles.statusActions}>
          {post.status === 'draft' && (
            <TouchableOpacity
              onPress={() => updatePostStatus(post.id, 'published')}
              style={[styles.statusActionButton, { backgroundColor: '#10b98120' }]}
            >
              <Text style={[styles.statusActionText, { color: '#10b981' }]}>Publish</Text>
            </TouchableOpacity>
          )}
          {post.status === 'published' && (
            <TouchableOpacity
              onPress={() => updatePostStatus(post.id, 'archived')}
              style={[styles.statusActionButton, { backgroundColor: '#6b728020' }]}
            >
              <Text style={[styles.statusActionText, { color: '#6b7280' }]}>Archive</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

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
          <Text style={[{ fontSize: 20, fontWeight: '600' as const, color: colors.text }]}>
            AI Posts
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            <IconSymbol size={20} name="plus" color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol size={20} name="magnifyingglass" color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search posts..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
            {['all', 'draft', 'published', 'archived'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status as any)}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: filterStatus === status ? colors.primary : colors.surface,
                    borderColor: colors.border
                  }
                ]}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterStatus === status ? colors.background : colors.text }
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoadingPosts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading posts...
              </Text>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="doc.richtext" color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery || filterStatus !== 'all' ? 'No posts found' : 'No posts yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Create your first AI-powered post to get started'
                }
              </Text>
              {!searchQuery && filterStatus === 'all' && (
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  style={[styles.emptyActionButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.emptyActionText, { color: colors.background }]}>
                    Create Post
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {filteredPosts.map(renderPostCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Post Modal - Notion Style */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={[styles.notionModalContainer, { backgroundColor: colors.background }]}>
          <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
          
          {/* Header */}
          <View style={[styles.notionHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                setEditorBlocks([]);
              }}
              style={styles.notionBackButton}
            >
              <IconSymbol size={24} name="chevron.left" color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.notionHeaderCenter}>
              <Text style={[styles.notionHeaderTitle, { color: colors.text }]}>New Post</Text>
            </View>
            
            <View style={styles.notionHeaderRight}>
              {/* Status Selector */}
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: newPost.status === 'published' ? '#10b981' : colors.backgroundSecondary,
                  }
                ]}
                onPress={() => {
                  setNewPost(prev => ({
                    ...prev,
                    status: prev.status === 'draft' ? 'published' : 'draft'
                  }));
                }}
              >
                <Text style={[
                  styles.statusButtonText,
                  {
                    color: newPost.status === 'published' ? '#ffffff' : colors.text,
                  }
                ]}>
                  {newPost.status === 'draft' ? 'Draft' : 'Published'}
                </Text>
              </TouchableOpacity>
              
              {/* Create Button */}
              <TouchableOpacity
                onPress={createPost}
                style={[
                  styles.notionCreateButton,
                  {
                    backgroundColor: editorBlocks.some(b => b.type === 'title' && b.content.trim()) ? colors.primary : colors.backgroundSecondary,
                  }
                ]}
                disabled={isLoading || !editorBlocks.some(b => b.type === 'title' && b.content.trim())}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[
                    styles.notionCreateButtonText,
                    {
                      color: editorBlocks.some(b => b.type === 'title' && b.content.trim()) ? colors.background : colors.textSecondary,
                    }
                  ]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <KeyboardAvoidingView
            style={styles.notionContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <NotionBlockEditor
              ref={editorRef}
              initialBlocks={[{ id: '1', type: 'title', content: '' }]}
              onBlocksChange={setEditorBlocks}
              autoFocus
            />
            
            {/* Bottom Toolbar */}
            <NotionToolbar
              onAIAssist={() => {
                // AI assistance - insert sample text
                editorRef.current?.insertText('✨ AI-generated content: This is a sample of how AI assistance would work.');
              }}
              onSelectBlockType={(blockType) => {
                // Add new block of selected type
                editorRef.current?.addBlock(blockType);
              }}
              onTextStyle={() => {
                // Transform current block to different heading
                const currentType = editorRef.current?.getCurrentBlockType();
                if (currentType === 'text') {
                  editorRef.current?.transformCurrentBlock('heading1');
                } else if (currentType === 'heading1') {
                  editorRef.current?.transformCurrentBlock('heading2');
                } else if (currentType === 'heading2') {
                  editorRef.current?.transformCurrentBlock('heading3');
                } else {
                  editorRef.current?.transformCurrentBlock('text');
                }
              }}
              onList={() => {
                // Add bullet list block
                editorRef.current?.addBlock('bullet');
              }}
              onImage={() => {
                // Insert image placeholder
                editorRef.current?.insertText('🖼️ [Image placeholder - Image upload coming soon]');
              }}
              onTurnInto={() => {
                // Transform current block to quote
                const currentType = editorRef.current?.getCurrentBlockType();
                if (currentType === 'quote') {
                  editorRef.current?.transformCurrentBlock('text');
                } else {
                  editorRef.current?.transformCurrentBlock('quote');
                }
              }}
              onUndo={() => {
                // Undo last change
                editorRef.current?.undo();
              }}
              onComment={() => {
                // Add comment placeholder
                editorRef.current?.insertText(' 💬 [Comment]');
              }}
              onMention={() => {
                // Add mention
                editorRef.current?.insertText('@mention ');
              }}
            />
          </KeyboardAvoidingView>
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

  createButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  emptyActionButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  emptyActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  postsContainer: {
    gap: Spacing.md,
  },
  postCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  postTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDate: {
    fontSize: 12,
  },
  statusActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statusActionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  statusActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  formInput: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  formTextArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 120,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Notion-style modal styles
  notionModalContainer: {
    flex: 1,
  },
  notionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  notionBackButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  notionHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  notionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  notionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notionCreateButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    minWidth: 70,
    alignItems: 'center',
  },
  notionCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notionContent: {
    flex: 1,
  },
});