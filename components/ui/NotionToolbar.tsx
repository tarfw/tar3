import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { IconSymbol } from './IconSymbol';

type BlockType = 'title' | 'heading1' | 'heading2' | 'heading3' | 'text' | 'bullet' | 'task' | 'quote' | 'code';

interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

interface NotionToolbarProps {
  onAIAssist?: () => void;
  onAddBlock?: () => void;
  onSelectBlockType?: (type: BlockType) => void;
  onTextStyle?: () => void;
  onList?: () => void;
  onImage?: () => void;
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
  onTurnInto,
  onUndo,
  onComment,
  onMention,
}: NotionToolbarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const toolbarActions: ToolbarAction[] = [
    {
      id: 'ai',
      icon: 'sparkles',
      label: 'AI',
      onPress: onAIAssist || (() => {}),
      variant: 'primary',
    },
    {
      id: 'h1',
      icon: '1.circle',
      label: 'H1',
      onPress: () => onSelectBlockType?.('heading1'),
    },
    {
      id: 'h2',
      icon: '2.circle',
      label: 'H2', 
      onPress: () => onSelectBlockType?.('heading2'),
    },
    {
      id: 'h3',
      icon: '3.circle',
      label: 'H3',
      onPress: () => onSelectBlockType?.('heading3'),
    },
    {
      id: 'bullet',
      icon: 'list.bullet',
      label: 'Bullet',
      onPress: () => onSelectBlockType?.('bullet'),
    },
    {
      id: 'todo',
      icon: 'checkmark.square',
      label: 'Todo',
      onPress: () => onSelectBlockType?.('task'),
    },
    {
      id: 'image',
      icon: 'photo',
      label: 'Image',
      onPress: onImage || (() => {}),
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
    
    return (
      <TouchableOpacity
        key={action.id}
        style={[
          styles.toolbarButton,
          {
            backgroundColor: isPrimary ? colors.primary : 'transparent',
          }
        ]}
        onPress={action.onPress}
        activeOpacity={0.6}
      >
        <IconSymbol
          size={20}
          name={action.icon}
          color={isPrimary ? colors.background : colors.text}
        />
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
});