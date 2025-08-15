import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHybridDb, LocalNote } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function NoteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const hybridDb = useHybridDb();
  
  const [note, setNote] = useState<{ title: string; content: string }>({ 
    title: '', 
    content: '' 
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const placeholderColor = useThemeColor({}, 'tabIconDefault') || '#8E8E93';

  // Load note data
  useEffect(() => {
    const fetchNote = () => {
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
        Alert.alert('Error', 'Failed to load note');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchNote();
    }
  }, [id, hybridDb]);

  const handleTitleChange = async (title: string) => {
    setNote((prev) => ({ ...prev, title }));
    try {
      await hybridDb.updateNote(id as string, { title });
    } catch (error) {
      console.error('Error updating note title:', error);
    }
  };

  const handleContentChange = async (content: string) => {
    setNote((prev) => ({ ...prev, content }));
    try {
      await hybridDb.updateNote(id as string, { content });
    } catch (error) {
      console.error('Error updating note content:', error);
    }
  };

  const handlePushSync = async () => {
    try {
      await hybridDb.syncWithTurso();
      Alert.alert('Success', 'Note pushed to cloud');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync note');
      console.error('Sync error:', error);
    }
  };

  const handleDeleteNote = async () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await hybridDb.deleteNote(id as string);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete note');
              console.error('Delete note error:', error);
            }
          },
        },
      ]
    );
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
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          headerTitle: note.title || 'Untitled',
          headerStyle: { backgroundColor },
          headerTintColor: textColor,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleDeleteNote}
                style={[styles.headerButton, styles.deleteButton]}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePushSync}
                style={styles.headerButton}
              >
                <Text style={[styles.headerButtonText, { color: tintColor }]}>Push</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 16,
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
