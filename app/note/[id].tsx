import { useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const hybridDb = useHybridDb();
  
  const [note, setNote] = useState<{ title: string; content: string }>({ 
    title: '', 
    content: '' 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewNote, setIsNewNote] = useState(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const placeholderColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  // Load note data once on mount
  useEffect(() => {
    if (id === 'new') {
      // New note - start with empty state
      setIsNewNote(true);
      setNote({ title: '', content: '' });
      setIsLoading(false);
    } else if (id) {
      // Existing note - load from database
      try {
        const currentNote = hybridDb.getNoteById(id as string);
        if (currentNote) {
          setNote({
            title: currentNote.title || '',
            content: currentNote.content || '',
          });
        }
      } catch (error) {
        console.error('Error fetching note:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [id]);

  const handleTitleChange = (title: string) => {
    // Update UI immediately for smooth typing
    setNote((prev) => ({ ...prev, title }));
    if (!isNewNote) {
      setHasUnsavedChanges(true);
    }
  };

  const handleContentChange = (content: string) => {
    // Update UI immediately for smooth typing
    setNote((prev) => ({ ...prev, content }));
    if (!isNewNote) {
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    try {
      if (isNewNote) {
        // Create new note in database
        const newNote = await hybridDb.createNote();
        if (newNote) {
          // Update the newly created note with our content
          await hybridDb.updateNote(newNote.id, { 
            title: note.title, 
            content: note.content 
          });
          setHasUnsavedChanges(false);
          router.back();
        }
      } else {
        // Update existing note
        await hybridDb.updateNote(id as string, { 
          title: note.title, 
          content: note.content 
        });
        setHasUnsavedChanges(false);
        router.back();
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDeleteNote = async () => {
    if (isNewNote) {
      // For new notes, just go back without deleting anything
      router.back();
      return;
    }
    
    try {
      await hybridDb.deleteNote(id as string);
      router.back();
    } catch (error) {
      console.error('Delete note error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: textColor }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor, elevation: 0 }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: placeholderColor + '40' }]}>
        <View>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isNewNote ? 'New Note' : 'Note'}
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={handleDeleteNote}
            style={[styles.headerButton, styles.deleteButton]}
          >
            <Text style={styles.deleteButtonText}>
              {isNewNote ? 'Cancel' : 'Delete'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.headerButton,
              (hasUnsavedChanges || isNewNote) && { backgroundColor: tintColor + '20' }
            ]}
          >
            <Text style={[
              styles.headerButtonText, 
              { color: (hasUnsavedChanges || isNewNote) ? tintColor : tintColor + '60' }
            ]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <TextInput
          style={[styles.titleInput, { color: textColor }]}
          value={note.title}
          onChangeText={handleTitleChange}
          placeholder="Note title"
          placeholderTextColor={placeholderColor}
          maxLength={100}
        />
        
        <TextInput
          style={[styles.contentInput, { color: textColor }]}
          value={note.content}
          onChangeText={handleContentChange}
          placeholder="Start writing..."
          placeholderTextColor={placeholderColor}
          multiline
          textAlignVertical="top"
          autoFocus
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
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
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
    elevation: 0,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    paddingTop: 0,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ef444420',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
});
