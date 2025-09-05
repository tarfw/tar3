import { IconSymbol } from '@/components/ui/IconSymbol';
// Note: HybridDb removed - this component needs to be updated for local-first approach
import { useThemeColor } from '@/hooks/useThemeColor';
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

  const handleDeleteNote = async (noteId: number) => {
    try {
      await hybridDb.deleteNote(noteId);
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  const handleSync = async () => {
    try {
      await hybridDb.syncWithInstant();
    } catch (error) {
      console.error('Sync error:', error);
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
          {item.id}
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
    <SafeAreaView style={[styles.container, { backgroundColor, elevation: 0 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Notes
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleSync}
            style={styles.headerButton}
          >
            <Text style={[styles.headerButtonText, { color: tintColor }]}>Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCreateNote}
            style={styles.headerButton}
          >
            <IconSymbol size={20} name="plus" color={tintColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id.toString()}
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
    elevation: 0,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 0,
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
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