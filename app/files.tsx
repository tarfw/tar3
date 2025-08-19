import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  sizeLabel: string;
}

const sampleFiles: FileItem[] = [];

export default function FilesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colors);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'images' | 'videos' | 'documents'>('all');

  const filtered = sampleFiles.filter((f) => {
    const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'images' && f.type === 'image') ||
      (typeFilter === 'videos' && f.type === 'video') ||
      (typeFilter === 'documents' && f.type === 'document');
    return matchesQuery && matchesType;
  });

  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}20` }]}>
        <IconSymbol name={item.type === 'image' ? 'photo' : item.type === 'video' ? 'play.rectangle' : 'doc.text'} size={24} color={colors.primary} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[TextStyles.label, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[TextStyles.caption, { color: colors.textSecondary }]}>{item.sizeLabel}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomWidth: 0.5, borderColor: colors.border }]}>
        <Text style={[TextStyles.h4, { color: colors.text }]}>Files</Text>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerBtn}>
          <IconSymbol name="gearshape" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchRow, { borderColor: colors.border }]}> 
        <IconSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search files"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            const next = typeFilter === 'all' ? 'images' : typeFilter === 'images' ? 'videos' : typeFilter === 'videos' ? 'documents' : 'all';
            setTypeFilter(next);
          }}
        >
          <IconSymbol name="line.3.horizontal.decrease" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}10` }]}>
            <IconSymbol name="folder" size={28} color={colors.primary} />
          </View>
          <Text style={[TextStyles.h4, { color: colors.text, marginTop: 8 }]}>No files yet</Text>
          <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>Upload files to manage images, videos and documents in one place.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
            <Text style={[TextStyles.label, { color: colors.onPrimary }]}>Upload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    ...TextStyles.body,
    paddingVertical: 6,
  },
  filterBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardBody: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
});
