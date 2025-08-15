import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHybridDb, LocalNote } from '@/contexts/HybridDbContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatDate } from '@/lib/hybridDataService';

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const hybridDb = useHybridDb();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';
  const secondaryTextColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  // Get notes from hybrid database
  const notes = hybridDb.getAllNotes();

  const filteredNotes = notes.filter(
    (note) =>
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = async () => {
    console.log('Creating note...');
    try {
      const newNote = await hybridDb.createNote();
      if (newNote) {
        router.push(`/note/${newNote.id}`);
      } else {
        Alert.alert('Error', 'Failed to create note');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create note');
      console.error('Create note error:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await hybridDb.deleteNote(noteId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete note');
      console.error('Delete note error:', error);
    }
  };

  const handlePullSync = async () => {
    try {
      await hybridDb.syncWithTurso();
      Alert.alert('Success', 'Notes synced from cloud');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync notes');
      console.error('Sync error:', error);
    }
  };

  const renderNote = ({ item }: { item: LocalNote }) => (
    <TouchableOpacity
      style={[styles.noteItem, { backgroundColor: cardColor, borderColor }]}
      onPress={() => router.push(`/note/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.noteContent}>
        <Text style={[styles.noteTitle, { color: textColor }]} numberOfLines={1}>
          {item.title || 'Untitled Note'}
        </Text>
        <Text style={[styles.noteDate, { color: secondaryTextColor }]}>
          {formatDate(item.modifiedDate)}
        </Text>
        <Text style={[styles.notePreview, { color: secondaryTextColor }]} numberOfLines={2}>
          {item.content || 'No additional text'}
        </Text>
      </View>
      
      {/* Delete button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => handleDeleteNote(item.id),
              },
            ]
          );
        }}
      >
        <IconSymbol size={18} name="trash" color="#ef4444" />
      </TouchableOpacity>

      {/* Sync status indicator */}
      {!item.syncedToTurso && (
        <View style={[styles.syncIndicator, { backgroundColor: '#f59e0b' }]}>
          <IconSymbol size={12} name="hourglass" color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={[styles.searchContainer, { backgroundColor: borderColor + '40' }]}>
        <IconSymbol size={20} name="magnifyingglass" color={secondaryTextColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search notes..."
          placeholderTextColor={secondaryTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol size={20} name="xmark.circle.fill" color={secondaryTextColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol size={64} name="note.text" color={secondaryTextColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No notes yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
        Tap the + button to create your first note
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          headerTitle: 'Notes',
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
          headerRight: () => (
            <TouchableOpacity
              onPress={handlePullSync}
              style={styles.headerButton}
            >
              <Text style={[styles.headerButtonText, { color: tintColor }]}>Pull</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.content}>
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            filteredNotes.length === 0 && styles.listContentEmpty
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={handleCreateNote}
          activeOpacity={0.8}
        >
          <IconSymbol size={24} name="plus" color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
  },
  listContent: {
    paddingBottom: 100, // Extra padding for FAB
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 13,
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  syncIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
