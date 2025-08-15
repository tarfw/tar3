import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Colors, getPriorityColor } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DataService } from '@/lib/dataService';
import { db, Issue } from '@/lib/instant';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'assigned' | 'created' | 'subscribed'>('assigned');
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusPickerAnimation] = useState(new Animated.Value(0));

  // Use InstantDB's useLocalId for consistent user identification
  const localUserId = db.useLocalId('current-user');

  // Query all issues with simplified schema
  const { isLoading, error, data } = db.useQuery({
    issues: {
      $: {
        order: { updatedAt: 'desc' },
      },
    },
  });

  // Filter issues based on selected tab
  const getFilteredIssues = () => {
    const issues = data?.issues || [];
    
    switch (selectedTab) {
      case 'assigned':
        return issues.filter(issue => issue.assigneeId === localUserId || issue.assigneeId === 'demo-user-1');
      case 'created':
        return issues.filter(issue => issue.creatorId === localUserId || issue.creatorId === 'demo-user-1');
      case 'subscribed':
        // For now, show all issues as "subscribed"
        return issues;
      default:
        return issues;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };


  const handleIssuePress = (issue: Issue) => {
    router.push(`/issue/${issue.id}`);
  };

  const handleStatusPress = (issue: Issue, event: any) => {
    event.stopPropagation();
    setSelectedIssue(issue);
    setStatusPickerVisible(true);
    Animated.spring(statusPickerAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleStatusUpdate = async (statusId: string) => {
    if (!selectedIssue) return;
    
    try {
      await DataService.updateIssueStatus(selectedIssue.id, statusId);
      closeStatusPicker();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const closeStatusPicker = () => {
    Animated.spring(statusPickerAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setStatusPickerVisible(false);
      setSelectedIssue(null);
    });
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

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'completed': return 'checkmark.circle.fill';
      case 'started': return 'circle.fill';
      case 'unstarted': return 'circle';
      default: return 'circle';
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'completed': return colors.success;
      case 'started': return colors.warning;
      case 'unstarted': return colors.textTertiary;
      default: return colors.textTertiary;
    }
  };

  const renderIssueItem = ({ item: issue }: { item: Issue }) => {
    const priorityColor = getPriorityColor(issue.priority);
    const statusColor = issue.statusColor || colors.textTertiary;

    return (
      <TouchableOpacity
        style={[styles.issueItem, { backgroundColor: colors.background }]}
        onPress={() => handleIssuePress(issue)}
        activeOpacity={0.7}
      >
        <View style={styles.issueRow}>
          <IconSymbol
            size={16}
            name={getPriorityIcon(issue.priority)}
            color={priorityColor}
            style={styles.priorityIcon}
          />
          <TouchableOpacity
            onPress={(event) => handleStatusPress(issue, event)}
            style={styles.statusButton}
            activeOpacity={0.7}
          >
            <IconSymbol
              size={16}
              name={getStatusIcon(issue.status)}
              color={statusColor}
            />
          </TouchableOpacity>
          <View style={styles.issueContent}>
            <Text style={[TextStyles.body, { color: colors.text }]}>
              {issue.title}
            </Text>
            {issue.identifier && (
              <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                {issue.identifier}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={[TextStyles.label, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="tray" color={colors.iconSecondary} />
      <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
        No issues found
      </Text>
      <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
        Tap the + button to create your first issue.
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

  const filteredIssues = getFilteredIssues();
  
  // Debug logging
  React.useEffect(() => {
    console.log('Issues data:', data?.issues?.length || 0, 'issues found');
    console.log('Filtered issues:', filteredIssues.length, 'for tab:', selectedTab);
  }, [data?.issues, filteredIssues.length, selectedTab]);
  
  // Group issues by status (simplified)
  const todoIssues = filteredIssues.filter(issue => issue.status === 'todo');
  const inProgressIssues = filteredIssues.filter(issue => issue.status === 'in-progress');
  const doneIssues = filteredIssues.filter(issue => issue.status === 'done');
  const backlogIssues = filteredIssues.filter(issue => issue.status === 'backlog');
  
  const sections = [
    ...(backlogIssues.length > 0 ? [{ title: 'Backlog', data: backlogIssues }] : []),
    ...(todoIssues.length > 0 ? [{ title: 'Todo', data: todoIssues }] : []),
    ...(inProgressIssues.length > 0 ? [{ title: 'In Progress', data: inProgressIssues }] : []),
    ...(doneIssues.length > 0 ? [{ title: 'Done', data: doneIssues }] : []),
  ];
  
  // If no sections, show all issues
  if (sections.length === 0 && filteredIssues.length > 0) {
    sections.push({ title: 'Issues', data: filteredIssues });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[TextStyles.h2, { color: colors.text }]}>
            Tasks
          </Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle size={18} />
          <TouchableOpacity style={styles.headerAction}>
            <IconSymbol size={20} name="line.3.horizontal.decrease" color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <IconSymbol size={20} name="ellipsis" color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabSelector, { backgroundColor: colors.background }]}>
        {(['assigned', 'created', 'subscribed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              selectedTab === tab && { backgroundColor: colors.backgroundSecondary }
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[
              TextStyles.body,
              {
                color: selectedTab === tab ? colors.text : colors.textSecondary,
                fontWeight: selectedTab === tab ? '600' : '400'
              }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        renderItem={renderIssueItem}
        renderSectionHeader={renderSectionHeader}
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
        stickySectionHeadersEnabled={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/create-issue')}
        activeOpacity={0.8}
      >
        <IconSymbol size={24} name="plus" color="white" />
      </TouchableOpacity>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible}
        transparent
        animationType="none"
        onRequestClose={closeStatusPicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closeStatusPicker}>
          <Animated.View
            style={[
              styles.statusPicker,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                transform: [
                  {
                    scale: statusPickerAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: statusPickerAnimation,
              },
            ]}
          >
            <View style={[styles.statusPickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[TextStyles.h3, { color: colors.text }]}>
                Update Status
              </Text>
              <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
                {selectedIssue?.title}
              </Text>
            </View>
            
            <View style={styles.statusList}>
              {[
                { key: 'backlog', name: 'Backlog', color: '#64748B' },
                { key: 'todo', name: 'Todo', color: '#94A3B8' },
                { key: 'in-progress', name: 'In Progress', color: '#3B82F6' },
                { key: 'done', name: 'Done', color: '#10B981' },
              ].map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusOption,
                    selectedIssue?.status === status.key && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => handleStatusUpdate(status.key)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    size={18}
                    name={getStatusIcon(status.key)}
                    color={status.color}
                    style={styles.statusOptionIcon}
                  />
                  <Text style={[TextStyles.body, { color: colors.text, flex: 1 }]}>
                    {status.name}
                  </Text>
                  {selectedIssue?.status === status.key && (
                    <IconSymbol
                      size={16}
                      name="checkmark"
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  issueItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueContent: {
    flex: 1,
  },
  priorityIcon: {
    marginRight: Spacing.sm,
  },
  statusIcon: {
    marginRight: Spacing.md,
  },
  statusButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
    borderRadius: Radius.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing['4xl'],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  demoButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusPicker: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.xl,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  statusPickerHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  statusList: {
    maxHeight: 300,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statusOptionIcon: {
    marginRight: Spacing.md,
  },
});
