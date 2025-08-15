import { IconSymbol } from '@/components/ui/IconSymbol';
import { LocalNote, useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatDate } from '@/lib/hybridDataService';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const handleCreateNote = () => {
    // Navigate to new note editor without creating in database
    router.push('/note/new');
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await hybridDb.deleteNote(noteId);
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const handlePullSync = async () => {
    try {
      await hybridDb.syncWithTurso();
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const handlePushSync = async () => {
    try {
      await hybridDb.syncWithTurso();
    } catch (error) {
      console.error('Push sync error:', error);
    }
  };

  const renderNote = ({ item }: { item: LocalNote }) => (
    <TouchableOpacity
      style={[styles.noteItem, { backgroundColor }]}
      onPress={() => router.push(`/note/${item.id}`)}
      activeOpacity={0.7}
      onLongPress={() => handleDeleteNote(item.id)} // Long press to delete
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
      
      {/* Delete button - visible on the right */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteNote(item.id);
        }}
      >
        <IconSymbol size={18} name="trash" color="#ef4444" />
      </TouchableOpacity>
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
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handlePullSync}
                style={styles.headerButton}
              >
                <Text style={[styles.headerButtonText, { color: tintColor }]}>Pull</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePushSync}
                style={styles.headerButton}
              >
                <Text style={[styles.headerButtonText, { color: tintColor }]}>Push</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateNote}
                style={styles.headerButton}
              >
                <IconSymbol size={20} name="plus" color={tintColor} />
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
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

  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
