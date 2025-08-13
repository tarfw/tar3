import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { db, Issue, Comment } from '@/lib/instant';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ActivityItem = {
  id: string;
  type: 'issue_created' | 'issue_updated' | 'comment_added';
  title: string;
  message: string;
  createdAt: string;
  issueId?: string;
  issue?: Issue;
};

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  // Query recent issues and comments for activity feed
  const { isLoading, error, data } = db.useQuery({
    issues: {
      $: {
        limit: 10,
        order: { createdAt: 'desc' },
      },
    },
    comments: {
      $: {
        limit: 5,
        order: { createdAt: 'desc' },
      },
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Instant DB automatically handles refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleActivityPress = (activity: ActivityItem) => {
    // Navigate to issue if it exists
    if (activity.issueId) {
      router.push(`/issue/${activity.issueId}`);
    }
  };

  // Create activity feed from issues and comments
  const createActivityFeed = (): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    
    // Add issues as activities
    if (data?.issues) {
      data.issues.forEach((issue) => {
        activities.push({
          id: `issue-${issue.id}`,
          type: 'issue_created',
          title: 'New issue created',
          message: issue.title,
          createdAt: issue.createdAt,
          issueId: issue.id,
          issue,
        });
      });
    }

    // Add comments as activities
    if (data?.comments) {
      data.comments.forEach((comment) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: 'comment_added',
          title: 'New comment added',
          message: comment.body.slice(0, 100) + (comment.body.length > 100 ? '...' : ''),
          createdAt: comment.createdAt,
          issueId: comment.issueId,
        });
      });
    }

    // Sort by creation date (newest first)
    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const renderActivityItem = ({ item: activity }: { item: ActivityItem }) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'issue_created':
          return 'plus.circle.fill';
        case 'comment_added':
          return 'bubble.left.fill';
        case 'issue_updated':
          return 'pencil.circle.fill';
        default:
          return 'bell.fill';
      }
    };

    const getActivityColor = (type: string) => {
      switch (type) {
        case 'issue_created':
          return colors.primary;
        case 'comment_added':
          return colors.warning;
        case 'issue_updated':
          return colors.success;
        default:
          return colors.iconSecondary;
      }
    };

    return (
      <TouchableOpacity
        style={[styles.notificationItem, { backgroundColor: colors.surface }]}
        onPress={() => handleActivityPress(activity)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <IconSymbol
                size={20}
                name={getActivityIcon(activity.type)}
                color={getActivityColor(activity.type)}
              />
            </View>
            <View style={styles.notificationText}>
              <Text style={[TextStyles.label, { color: colors.text }]}>
                {activity.title}
              </Text>
              <Text style={[TextStyles.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                {activity.message}
              </Text>
            </View>
          </View>
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: Spacing.sm }]}>
            {new Date(activity.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="tray" color={colors.iconSecondary} />
      <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
        No recent activity
      </Text>
      <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
        Create some issues or add comments to see activity here.
      </Text>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

  const activities = createActivityFeed();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[TextStyles.h2, { color: colors.text }]}>Activity</Text>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 0.5,
  },
  headerAction: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: Spacing.md,
    paddingTop: 2,
  },
  notificationText: {
    flex: 1,
  },
  actionButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
