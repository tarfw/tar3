import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { db, Issue } from '@/lib/instant';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyIssuesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  // Query issues
  const { isLoading, error, data } = db.useQuery({
    issues: {},
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleIssuePress = (issue: Issue) => {
    router.push(`/issue/${issue.id}`);
  };

  const handleCreateIssue = () => {
    router.push('/create-issue');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return colors.textSecondary;
      case 'in-progress':
        return colors.warning;
      case 'done':
        return colors.success;
      case 'backlog':
        return colors.textTertiary;
      default:
        return colors.textSecondary;
    }
  };

  const renderIssueItem = ({ item: issue }: { item: Issue }) => {
    const statusColor = getStatusColor(issue.status);

    return (
      <TouchableOpacity
        style={[styles.issueItem, { backgroundColor: colors.surface }]}
        onPress={() => handleIssuePress(issue)}
        activeOpacity={0.7}
      >
        <View style={styles.issueHeader}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <View style={styles.issueInfo}>
            <Text style={[TextStyles.label, { color: colors.text }]}>
              {issue.title}
            </Text>
            <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
              {issue.id.slice(0, 8)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>
              {issue.status}
            </Text>
          </View>
        </View>

        {issue.description && (
          <Text
            style={[
              TextStyles.bodySmall,
              { color: colors.textSecondary, marginTop: Spacing.sm },
            ]}
            numberOfLines={2}
          >
            {issue.description}
          </Text>
        )}

        <View style={styles.issueFooter}>
          <Text style={[TextStyles.caption, { color: colors.textTertiary }]}>
            Updated {new Date(issue.updatedAt).toLocaleDateString()}
          </Text>
          <IconSymbol size={16} name="chevron.right" color={colors.iconSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="doc.badge.plus" color={colors.iconSecondary} />
      <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
        No issues yet
      </Text>
      <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
        Create your first issue to start tracking your work.
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateIssue}
      >
        <IconSymbol size={16} name="plus" color={colors.textInverse} />
        <Text style={[TextStyles.buttonSmall, { color: colors.textInverse, marginLeft: Spacing.xs }]}>
          Create Issue
        </Text>
      </TouchableOpacity>
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

  const issues = data?.issues || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            My Issues
          </Text>
          <Text style={[TextStyles.bodySmall, { color: colors.textSecondary }]}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleCreateIssue} style={styles.headerAction}>
          <IconSymbol size={20} name="plus" color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={issues}
        renderItem={renderIssueItem}
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
        ItemSeparatorComponent={() => <View style={{ height: Spacing.xs }} />}
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
    padding: Spacing.xs,
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  issueItem: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  issueInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});