import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, getPriorityColor } from '@/constants/Colors';
import { Radius, Shadow, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Comment, db, id, queries } from '@/lib/instant';
import { router, Stack, useLocalSearchParams } from 'expo-router';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IssueDetailScreen() {
  const { id: issueId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [commentText, setCommentText] = useState('');
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  
  // Use InstantDB's useLocalId for consistent user identification
  const localUserId = db.useLocalId('current-user');

  // Query issue details and comments
  const { isLoading, error, data } = db.useQuery(queries.getIssueDetails(issueId || ''));

  const issue = data?.issues?.[0];
  const comments = data?.comments || [];

  const handleBack = () => {
    router.back();
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !issue) return;

    try {
      const commentId = id();
      const newComment = {
        id: commentId,
        body: commentText.trim(),
        issueId: issue.id,
        authorId: localUserId || 'anonymous-user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.transact([
        db.tx.comments[commentId].update(newComment),
      ]);

      setCommentText('');
      setIsCommentFocused(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleStatusChange = () => {
    if (!issue) return;
    
    Alert.alert(
      'Change Status',
      'Select a new status for this issue',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Todo', onPress: () => updateIssueStatus('todo') },
        { text: 'In Progress', onPress: () => updateIssueStatus('in-progress') },
        { text: 'Done', onPress: () => updateIssueStatus('done') },
      ]
    );
  };

  const updateIssueStatus = async (newStatusId: string) => {
    if (!issue) return;

    try {
      await db.transact([
        db.tx.issues[issue.id].update({
          statusId: newStatusId,
          updatedAt: new Date().toISOString(),
        }),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case 1: return 'exclamationmark.3';
      case 2: return 'exclamationmark.2';
      case 3: return 'minus';
      case 4: return 'arrow.down';
      default: return 'minus';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Medium';
    }
  };

  const renderComment = (comment: Comment, index: number) => (
    <View key={comment.id} style={[styles.commentItem, { backgroundColor: colors.surface }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.authorAvatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.authorAvatarText, { color: colors.textInverse }]}>
            U
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={[TextStyles.label, { color: colors.text }]}>
            User
          </Text>
          <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
            {new Date(comment.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
      <Text style={[TextStyles.body, { color: colors.text, marginTop: Spacing.sm }]}>
        {comment.body}
      </Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <IconSymbol size={48} name="exclamationmark.triangle" color={colors.error} />
          <Text style={[TextStyles.h3, { color: colors.text, marginTop: Spacing.lg }]}>
            Something went wrong
          </Text>
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            {error.message}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <IconSymbol size={48} name="doc.text" color={colors.iconSecondary} />
          <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
            Issue not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const priorityColor = getPriorityColor(issue.priority);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={colors.icon} />
        </TouchableOpacity>
        <Text style={[TextStyles.label, { color: colors.text, flex: 1, textAlign: 'center' }]}>
          {issue.identifier}
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <IconSymbol size={20} name="ellipsis" color={colors.icon} />
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
          {/* Issue Header */}
          <View style={[styles.issueHeader, { backgroundColor: colors.surface }]}>
            <View style={styles.issueHeaderTop}>
              <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                <IconSymbol
                  size={12}
                  name={getPriorityIcon(issue.priority)}
                  color={priorityColor}
                />
                <Text style={[TextStyles.caption, { color: priorityColor, marginLeft: 4 }]}>
                  {getPriorityLabel(issue.priority)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleStatusChange}
                style={[styles.statusBadge, { backgroundColor: colors.backgroundSecondary }]}
              >
                <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
                  Status
                </Text>
                <IconSymbol size={12} name="chevron.down" color={colors.iconSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[TextStyles.h2, { color: colors.text, marginTop: Spacing.md }]}>
              {issue.title}
            </Text>

            {issue.description && (
              <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                {issue.description}
              </Text>
            )}

            <View style={styles.issueMeta}>
              <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
                Created {new Date(issue.createdAt).toLocaleDateString()}
              </Text>
              {issue.dueDate && (
                <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
                  Due {new Date(issue.dueDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={[TextStyles.h4, { color: colors.text, marginBottom: Spacing.lg }]}>
              Comments ({comments.length})
            </Text>
            {comments.map(renderComment)}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.commentInputContainer, { backgroundColor: colors.backgroundElevated, borderTopColor: colors.border }]}>
          <View style={[styles.commentInputWrapper, { backgroundColor: colors.backgroundSecondary }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              value={commentText}
              onChangeText={setCommentText}
              onFocus={() => setIsCommentFocused(true)}
              onBlur={() => setIsCommentFocused(false)}
              multiline
              maxLength={500}
            />
            {(commentText.trim() || isCommentFocused) && (
              <TouchableOpacity
                onPress={handleAddComment}
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: commentText.trim() ? colors.primary : colors.backgroundTertiary,
                  },
                ]}
                disabled={!commentText.trim()}
              >
                <IconSymbol
                  size={16}
                  name="arrow.up"
                  color={commentText.trim() ? colors.textInverse : colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  moreButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  scrollContainer: {
    paddingBottom: Spacing['2xl'],
  },
  issueHeader: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  issueHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  issueMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  commentsSection: {
    paddingHorizontal: Spacing.lg,
  },
  commentItem: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  commentMeta: {
    flex: 1,
  },
  commentInputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 0.5,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  commentInput: {
    flex: 1,
    ...TextStyles.body,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
