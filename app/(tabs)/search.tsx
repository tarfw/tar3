import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors, getPriorityColor } from '@/constants/Colors';
import { TextStyles, Spacing, Radius } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { db, Issue, Project } from '@/lib/instant';

interface SearchResult {
  type: 'issue' | 'project';
  data: Issue | Project;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    // For now, we'll use a simple timeout to simulate search
    // In a real app, this would be an actual search query
    setTimeout(() => {
      // Mock search results for demo
      const mockResults: SearchResult[] = [];
      
      if (query.toLowerCase().includes('bug')) {
        mockResults.push({
          type: 'issue',
          data: {
            id: 'issue-1',
            title: 'Fix login bug',
            identifier: 'LIN-123',
            description: 'Users cannot log in on mobile devices',
            priority: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectId: 'project-1',
            statusId: 'status-1',
            creatorId: 'user-1',
          } as Issue,
        });
      }
      
      if (query.toLowerCase().includes('project') || query.toLowerCase().includes('linear')) {
        mockResults.push({
          type: 'project',
          data: {
            id: 'project-1',
            name: 'Linear Mobile App',
            key: 'LIN',
            description: 'Mobile companion app for Linear',
            color: '#5E6AD2',
            status: 'active',
            teamId: 'team-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Project,
        });
      }
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleResultPress = (result: SearchResult) => {
    Keyboard.dismiss();
    
    if (result.type === 'issue') {
      router.push(`/issue/${result.data.id}`);
    } else {
      router.push(`/project/${result.data.id}`);
    }
  };

  const renderSearchResult = ({ item: result }: { item: SearchResult }) => {
    if (result.type === 'issue') {
      const issue = result.data as Issue;
      const priorityColor = getPriorityColor(issue.priority);

      return (
        <TouchableOpacity
          style={[styles.resultItem, { backgroundColor: colors.surface }]}
          onPress={() => handleResultPress(result)}
          activeOpacity={0.7}
        >
          <View style={styles.resultHeader}>
            <View style={styles.typeIcon}>
              <IconSymbol size={16} name="doc.text" color={colors.primary} />
              <Text style={[TextStyles.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                Issue
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
              <IconSymbol size={10} name="exclamationmark" color={priorityColor} />
            </View>
          </View>
          
          <Text style={[TextStyles.label, { color: colors.text, marginTop: Spacing.xs }]}>
            {issue.title}
          </Text>
          
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {issue.identifier}
          </Text>

          {issue.description && (
            <Text
              style={[
                TextStyles.bodySmall,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
              numberOfLines={2}
            >
              {issue.description}
            </Text>
          )}
        </TouchableOpacity>
      );
    } else {
      const project = result.data as Project;

      return (
        <TouchableOpacity
          style={[styles.resultItem, { backgroundColor: colors.surface }]}
          onPress={() => handleResultPress(result)}
          activeOpacity={0.7}
        >
          <View style={styles.resultHeader}>
            <View style={styles.typeIcon}>
              <IconSymbol size={16} name="folder" color={colors.warning} />
              <Text style={[TextStyles.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                Project
              </Text>
            </View>
          </View>
          
          <Text style={[TextStyles.label, { color: colors.text, marginTop: Spacing.xs }]}>
            {project.name}
          </Text>
          
          <Text style={[TextStyles.caption, { color: colors.textTertiary, marginTop: 2 }]}>
            {project.key}
          </Text>

          {project.description && (
            <Text
              style={[
                TextStyles.bodySmall,
                { color: colors.textSecondary, marginTop: Spacing.xs },
              ]}
              numberOfLines={2}
            >
              {project.description}
            </Text>
          )}
        </TouchableOpacity>
      );
    }
  };

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[TextStyles.body, { color: colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (searchQuery.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol size={48} name="magnifyingglass" color={colors.iconSecondary} />
          <Text style={[TextStyles.h4, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
            No results found
          </Text>
          <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
            Try searching for different keywords or check your spelling.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol size={64} name="magnifyingglass" color={colors.iconSecondary} />
        <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
          Search Linear
        </Text>
        <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
          Find issues, projects, and more across your workspace.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <IconSymbol size={20} name="magnifyingglass" color={colors.iconSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search issues and projects..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <IconSymbol size={16} name="xmark.circle.fill" color={colors.iconSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...TextStyles.body,
  },
  listContainer: {
    flexGrow: 1,
    paddingTop: Spacing.sm,
  },
  resultItem: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
