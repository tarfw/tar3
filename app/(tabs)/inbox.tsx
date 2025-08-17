import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Person = {
  id: string;
  name: string;
  workProfile: string;
  location: 'Home' | 'Work' | 'University';
  avatar: string;
};

export default function InboxScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = useState('');

  // Sample data of 6 people
  const samplePeople: Person[] = [
    {
      id: '2',
      name: 'Jackson Houston',
      workProfile: 'Full Stack Developer',
      location: 'Work',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '3',
      name: 'Lina Bradley',
      workProfile: 'UX Researcher',
      location: 'University',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '4',
      name: 'Katie White',
      workProfile: 'Marketing Manager',
      location: 'Home',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '5',
      name: 'Mae Walsh',
      workProfile: 'Data Scientist',
      location: 'Work',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: '6',
      name: 'Adeline McGuire',
      workProfile: 'Software Engineer',
      location: 'University',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const filteredPeople = samplePeople.filter(person =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.workProfile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePersonPress = (person: Person) => {
    // Navigate to person profile or chat
    console.log('Person pressed:', person.name);
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'Home':
        return colors.success;
      case 'Work':
        return colors.primary;
      case 'University':
        return colors.warning;
      default:
        return colors.iconSecondary;
    }
  };

  const renderPersonItem = ({ item: person }: { item: Person }) => {
    return (
      <TouchableOpacity
        style={[styles.personCard, { backgroundColor: colors.surface }]}
        onPress={() => handlePersonPress(person)}
        activeOpacity={0.7}
      >
        <View style={styles.personContent}>
          <Image
            source={{ uri: person.avatar }}
            style={styles.avatar}
          />
          <View style={styles.personInfo}>
            <View style={styles.locationContainer}>
              <Text style={[styles.locationText, { color: getLocationColor(person.location) }]}>
                {person.location}
              </Text>
            </View>
            <Text style={[styles.personName, { color: colors.text }]}>
              {person.name}
            </Text>
            <Text style={[styles.workProfile, { color: colors.textSecondary }]}>
              {person.workProfile}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="person.2" color={colors.iconSecondary} />
      <Text style={[TextStyles.h3, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
        No people found
      </Text>
      <Text style={[TextStyles.body, { color: colors.textTertiary, marginTop: Spacing.sm, textAlign: 'center' }]}>
        Try searching with different keywords.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <IconSymbol size={20} name="magnifyingglass" color={colors.iconSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search people..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <IconSymbol size={16} name="xmark.circle.fill" color={colors.iconSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPeople}
        renderItem={renderPersonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        numColumns={1}
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
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  personCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  personContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.md,
  },
  personInfo: {
    flex: 1,
  },
  locationContainer: {
    marginBottom: Spacing.xs,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  workProfile: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
});
