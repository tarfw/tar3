import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { r2Service, type MediaFile } from '@/lib/r2-service';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { IconSymbol } from './IconSymbol';

type BlockType = 'title' | 'heading1' | 'heading2' | 'heading3' | 'text' | 'bullet' | 'task' | 'quote' | 'code';

interface ToolbarAction {
  id: string;
  icon?: string;  // Made optional for text-based buttons
  text?: string;  // Added text option
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface NotionToolbarProps {
  onAIAssist?: () => void;
  onAddBlock?: (type?: BlockType) => void;
  onSelectBlockType?: (type: BlockType) => void;
  onTextStyle?: () => void;
  onList?: () => void;
  onImage?: () => void;
  onImageInsert?: (imageUrl: string, imageName: string, imageKey?: string) => void; // Updated to include imageKey
  onTurnInto?: () => void;
  onUndo?: () => void;
  onComment?: () => void;
  onMention?: () => void;
}

export default function NotionToolbar({
  onAIAssist,
  onAddBlock,
  onSelectBlockType,
  onTextStyle,
  onList,
  onImage,
  onImageInsert,
  onTurnInto,
  onUndo,
  onComment,
  onMention,
}: NotionToolbarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permissions to upload images.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        quality: 0.8,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingImage(true);

      const mediaFile: MediaFile = {
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        size: asset.fileSize,
      };

      const uploadResult = await r2Service.uploadFile(mediaFile, 'media');
      
      if (uploadResult.success && uploadResult.url) {
        // Call the callback to insert the image into the editor with the key
        onImageInsert?.(uploadResult.url, mediaFile.name, uploadResult.key);
      } else {
        Alert.alert('Upload failed', uploadResult.error || 'Unknown error occurred while uploading image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Error', 'Failed to pick or upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const toolbarActions: ToolbarAction[] = [
    {
      id: 'text',
      text: 'Text',
      label: 'Add Text Block',
      onPress: () => onAddBlock?.('text'),
    },
    {
      id: 'h1',
      text: 'H1',
      label: 'Add H1',
      onPress: () => onAddBlock?.('heading1'),
    },
    {
      id: 'h2',
      text: 'H2',
      label: 'Add H2', 
      onPress: () => onAddBlock?.('heading2'),
    },
    {
      id: 'h3',
      text: 'H3',
      label: 'Add H3',
      onPress: () => onAddBlock?.('heading3'),
    },
    {
      id: 'bullet',
      icon: 'list.bullet',
      label: 'Add Bullet List',
      onPress: () => onAddBlock?.('bullet'),
    },
    {
      id: 'todo',
      icon: 'checkmark.square',
      label: 'Add Todo',
      onPress: () => onAddBlock?.('task'),
    },
    {
      id: 'image',
      icon: 'photo',
      label: 'Add Image',
      onPress: handleImageUpload,
    },
    {
      id: 'undo',
      icon: 'arrow.uturn.backward',
      label: 'Undo',
      onPress: onUndo || (() => {}),
    },
  ];

  const renderToolbarAction = (action: ToolbarAction) => {
    const isPrimary = action.variant === 'primary';
    const isImageUploading = action.id === 'image' && uploadingImage;
    
    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.toolbarButton,
          {
            backgroundColor: isPrimary ? colors.primary : 'transparent',
            opacity: isImageUploading ? 0.6 : 1,
          }
        ]}
        onPress={action.onPress}
        activeOpacity={0.6}
        disabled={isImageUploading}
      >
        {isImageUploading ? (
          <ActivityIndicator 
            size="small" 
            color={isPrimary ? colors.background : colors.text} 
          />
        ) : action.text ? (
          <Text
            style={[
              styles.buttonText,
              {
                color: isPrimary ? colors.background : colors.text,
              }
            ]}
          >
            {action.text}
          </Text>
        ) : action.icon ? (
          <IconSymbol
            size={20}
            name={action.icon}
            color={isPrimary ? colors.background : colors.text}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {toolbarActions.map(renderToolbarAction)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    gap: Spacing.md,
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.sm,
    width: 40,
    height: 40,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});