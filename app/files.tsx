import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { r2Service, type MediaFile } from '@/lib/r2-service';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  sizeLabel: string;
  url?: string;
  key?: string;
}

// Local state will hold uploaded files this session

export default function FilesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colors);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'images' | 'videos' | 'documents'>('all');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const filtered = files.filter((f) => {
    const matchesQuery = f.name.toLowerCase().includes(query.toLowerCase());
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'images' && f.type === 'image') ||
      (typeFilter === 'videos' && f.type === 'video') ||
      (typeFilter === 'documents' && f.type === 'document');
    return matchesQuery && matchesType;
  });

  const formatSize = useCallback((bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Unknown size';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  const onPressUpload = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions to upload files.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled) return;

      setUploading(true);
      for (const asset of result.assets) {
        const mediaFile: MediaFile = {
          uri: asset.uri,
          name: asset.fileName || `upload_${Date.now()}`,
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          size: asset.fileSize,
        };
        const res = await r2Service.uploadFile(mediaFile, 'media');
        if (res.success && res.url) {
          setFiles((prev) => [
            ...prev,
            {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              name: mediaFile.name,
              type: mediaFile.type.startsWith('image') ? 'image' : mediaFile.type.startsWith('video') ? 'video' : 'document',
              sizeLabel: formatSize(mediaFile.size),
              url: res.url,
              key: res.key,
            },
          ]);
        } else {
          Alert.alert('Upload failed', res.error || 'Unknown error');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick media');
    } finally {
      setUploading(false);
    }
  }, [formatSize]);

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
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]} activeOpacity={0.8} onPress={onPressUpload} disabled={uploading}>
            <Text style={[TextStyles.label, { color: colors.onPrimary }]}>Upload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
              <TouchableOpacity style={[styles.primaryBtn, { alignSelf: 'flex-start', backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]} activeOpacity={0.8} onPress={onPressUpload} disabled={uploading}>
                <Text style={[TextStyles.label, { color: colors.onPrimary }]}>Upload</Text>
              </TouchableOpacity>
            </View>
          }
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
