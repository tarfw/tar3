import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { IconSymbol } from './IconSymbol';

type BlockType = 'title' | 'heading1' | 'heading2' | 'heading3' | 'text' | 'bullet' | 'task' | 'quote' | 'code';

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { type: 'text', label: 'Text', icon: 'textformat', description: 'Just start writing with plain text' },
  { type: 'heading1', label: 'Heading 1', icon: 'textformat.size', description: 'Big section heading' },
  { type: 'heading2', label: 'Heading 2', icon: 'textformat.size', description: 'Medium section heading' },
  { type: 'heading3', label: 'Heading 3', icon: 'textformat.size', description: 'Small section heading' },
  { type: 'bullet', label: 'Bulleted list', icon: 'list.bullet', description: 'Create a simple bulleted list' },
  { type: 'task', label: 'To-do list', icon: 'checkmark.square', description: 'Track tasks with a to-do list' },
  { type: 'quote', label: 'Quote', icon: 'quote.bubble', description: 'Capture a quote' },
  { type: 'code', label: 'Code', icon: 'curlybraces', description: 'Capture a code snippet' },
];

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
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const toolbarActions: ToolbarAction[] = [
    {
      id: 'ai',
      icon: 'sparkles',
      label: 'AI',
      onPress: onAIAssist || (() => {}),
      variant: 'primary',
    },
    {
      id: 'blocks',
      icon: 'plus',
      label: 'Add Block',
      onPress: () => setShowBlockMenu(true),
    },
    {
      id: 'text-style',
      icon: 'textformat',
      label: 'Text Style',
      onPress: onTextStyle || (() => {}),
    },
    {
      id: 'list',
      icon: 'list.bullet',
      label: 'List',
      onPress: onList || (() => {}),
    },
    {
      id: 'image',
      icon: 'photo',
      label: 'Image',
      onPress: onImage || (() => {}),
    },
    {
      id: 'turn-into',
      icon: 'arrow.triangle.2.circlepath',
      label: 'Turn Into',
      onPress: onTurnInto || (() => {}),
    },
    {
      id: 'undo',
      icon: 'arrow.uturn.backward',
      label: 'Undo',
      onPress: onUndo || (() => {}),
    },
    {
      id: 'comment',
      icon: 'bubble.left',
      label: 'Comment',
      onPress: onComment || (() => {}),
    },
    {
      id: 'mention',
      icon: 'at',
      label: 'Mention',
      onPress: onMention || (() => {}),
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

  const handleBlockSelect = (blockType: BlockType) => {
    setShowBlockMenu(false);
    onSelectBlockType?.(blockType);
  };

  return (
    <>
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

      {/* Block Selection Modal */}
      <Modal
        visible={showBlockMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockMenu(false)}
      >
        <Pressable 
          style={styles.blockMenuOverlay} 
          onPress={() => setShowBlockMenu(false)}
        >
          <View style={[styles.blockMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.blockMenuHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.blockMenuTitle, { color: colors.text }]}>Basic blocks</Text>
              <TouchableOpacity
                onPress={() => setShowBlockMenu(false)}
                style={styles.blockMenuClose}
              >
                <IconSymbol size={20} name="xmark" color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.blockMenuContent}>
              <View style={styles.blockGrid}>
                {BLOCK_TYPE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.type}
                    style={[styles.blockGridItem, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => handleBlockSelect(option.type)}
                  >
                    <IconSymbol size={24} name={option.icon} color={colors.text} />
                    <Text style={[styles.blockGridLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
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
  toolbarButtonText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  blockMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  blockMenu: {
    backgroundColor: 'white',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: '50%',
    minHeight: 300,
  },
  blockMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  blockMenuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  blockMenuClose: {
    padding: Spacing.xs,
  },
  blockMenuContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  blockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  blockGridItem: {
    width: '47%',
    aspectRatio: 1.2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  blockGridLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});