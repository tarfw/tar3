import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { r2Service } from '@/lib/r2-service';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export type BlockType = 'title' | 'heading1' | 'heading2' | 'heading3' | 'text' | 'bullet' | 'task' | 'quote' | 'code' | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  imageUrl?: string;
  imageName?: string;
  imageKey?: string;
}

interface BlockTypeOption {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
}

interface NotionBlockEditorProps {
  initialBlocks?: Block[];
  onBlocksChange?: (blocks: Block[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ref?: React.RefObject<NotionBlockEditorMethods>;
}

export interface NotionBlockEditorMethods {
  addBlock: (type: BlockType) => void;
  addImageBlock: (imageUrl: string, imageName: string, imageKey?: string) => void;
  getCurrentBlockType: () => BlockType | null;
  transformCurrentBlock: (type: BlockType) => void;
  insertText: (text: string) => void;
  undo: () => void;
}

const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  { type: 'title', label: 'Title', icon: 'textformat.size', description: 'Big section heading' },
  { type: 'heading1', label: 'Heading 1', icon: 'textformat.size', description: 'Big section heading' },
  { type: 'heading2', label: 'Heading 2', icon: 'textformat.size', description: 'Medium section heading' },
  { type: 'heading3', label: 'Heading 3', icon: 'textformat.size', description: 'Small section heading' },
  { type: 'text', label: 'Text', icon: 'textformat', description: 'Just start writing with plain text' },
  { type: 'bullet', label: 'Bulleted list', icon: 'list.bullet', description: 'Create a simple bulleted list' },
  { type: 'task', label: 'To-do list', icon: 'checkmark.square', description: 'Track tasks with a to-do list' },
  { type: 'quote', label: 'Quote', icon: 'quote.bubble', description: 'Capture a quote' },
  { type: 'code', label: 'Code', icon: 'curlybraces', description: 'Capture a code snippet' },
  { type: 'image', label: 'Image', icon: 'photo', description: 'Display an image' },
];

export default React.forwardRef<NotionBlockEditorMethods, NotionBlockEditorProps>(function NotionBlockEditor({
  initialBlocks = [],
  onBlocksChange,
  placeholder = 'Start writing...',
  autoFocus = false,
}, ref) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length > 0 
      ? initialBlocks 
      : [{ id: generateId(), type: 'text', content: '' }]
  );
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [history, setHistory] = useState<Block[][]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const inputRefs = useRef<{ [key: string]: TextInput }>({});

  useEffect(() => {
    if (autoFocus && blocks.length > 0) {
      setTimeout(() => {
        focusBlock(blocks[0].id);
      }, 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    onBlocksChange?.(blocks);
  }, [blocks, onBlocksChange]);

  function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = [...prev, blocks];
      return newHistory.slice(-10); // Keep only last 10 states
    });
  }, [blocks]);

  const updateBlocks = useCallback((newBlocks: Block[] | ((prev: Block[]) => Block[])) => {
    saveToHistory();
    setBlocks(newBlocks);
  }, [saveToHistory]);

  const focusBlock = useCallback((blockId: string) => {
    setActiveBlockId(blockId);
    setTimeout(() => {
      inputRefs.current[blockId]?.focus();
    }, 100);
  }, []);

  const updateBlockContent = useCallback((blockId: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, content } : block
    ));
  }, []);

  const updateBlockType = useCallback((blockId: string, newType: BlockType) => {
    updateBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, type: newType, content: '' } : block
    ));
    
    // Force re-render and focus
    setRenderKey(prev => prev + 1);
    setTimeout(() => {
      focusBlock(blockId);
    }, 100);
  }, [focusBlock, updateBlocks]);

  const addNewBlock = useCallback((afterBlockId: string, type: BlockType = 'text') => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
    };

    updateBlocks(prev => {
      const index = prev.findIndex(block => block.id === afterBlockId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    setTimeout(() => {
      focusBlock(newBlock.id);
    }, 100);
  }, [focusBlock, updateBlocks]);

  const deleteBlock = useCallback((blockId: string) => {
    updateBlocks(prev => {
      if (prev.length <= 1) return prev; // Always keep at least one block
      
      const index = prev.findIndex(block => block.id === blockId);
      const newBlocks = prev.filter(block => block.id !== blockId);
      
      // Focus previous block
      if (index > 0) {
        setTimeout(() => {
          focusBlock(newBlocks[index - 1].id);
        }, 100);
      } else if (newBlocks.length > 0) {
        setTimeout(() => {
          focusBlock(newBlocks[0].id);
        }, 100);
      }
      
      return newBlocks;
    });
  }, [focusBlock, updateBlocks]);

  const handleBlockSubmit = useCallback((blockId: string) => {
    const currentBlock = blocks.find(block => block.id === blockId);
    const blockType = currentBlock?.type;
    const hasContent = currentBlock?.content.trim() !== '';
    
    // Title should create a text block
    if (blockType === 'title') {
      addNewBlock(blockId, 'text');
    }
    // For empty todo/bullet blocks, convert to text instead of creating new block
    else if ((blockType === 'bullet' || blockType === 'task') && !hasContent) {
      updateBlockType(blockId, 'text');
    }
    // For todo/bullet blocks with content, create new block of same type
    else if (blockType === 'bullet' || blockType === 'task') {
      addNewBlock(blockId, blockType);
    }
    // Default behavior for other blocks
    else {
      addNewBlock(blockId);
    }
  }, [addNewBlock, blocks, updateBlockType]);

  const handleBackspace = useCallback((blockId: string, content: string) => {
    if (content === '' && blocks.length > 1) {
      deleteBlock(blockId);
    }
  }, [blocks.length, deleteBlock]);

  // Imperative methods for toolbar
  const addBlockFromToolbar = useCallback((type: BlockType) => {
    const lastBlockId = blocks[blocks.length - 1]?.id;
    if (lastBlockId) {
      addNewBlock(lastBlockId, type);
    }
  }, [blocks, addNewBlock]);

  const addImageBlockFromToolbar = useCallback((imageUrl: string, imageName: string, imageKey?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type: 'image',
      content: imageName,
      imageUrl,
      imageName,
      imageKey,
    };

    updateBlocks(prev => {
      const newBlocks = [...prev, newBlock];
      return newBlocks;
    });

    setTimeout(() => {
      focusBlock(newBlock.id);
    }, 100);
  }, [focusBlock, updateBlocks]);

  const getCurrentBlockType = useCallback(() => {
    if (!activeBlockId) return null;
    const currentBlock = blocks.find(block => block.id === activeBlockId);
    return currentBlock?.type || null;
  }, [activeBlockId, blocks]);

  const transformCurrentBlock = useCallback((type: BlockType) => {
    if (activeBlockId) {
      updateBlockType(activeBlockId, type);
    }
  }, [activeBlockId, updateBlockType]);

  const insertTextAtCurrentBlock = useCallback((text: string) => {
    if (activeBlockId && inputRefs.current[activeBlockId]) {
      const currentBlock = blocks.find(block => block.id === activeBlockId);
      if (currentBlock) {
        updateBlockContent(activeBlockId, currentBlock.content + text);
      }
    }
  }, [activeBlockId, blocks, updateBlockContent]);

  const undoLastChange = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setBlocks(previousState);
      setHistory(prev => prev.slice(0, -1));
    }
  }, [history]);

  // Presigned URL management for R2 images
  const getPreviewUrl = useCallback(async (block: Block) => {
    if (!block.imageKey || previewUrls[block.id]) return;
    
    try {
      const signedUrl = await r2Service.getSignedUrl(block.imageKey, 3600); // 1 hour expiry
      if (signedUrl) {
        setPreviewUrls(prev => ({ ...prev, [block.id]: signedUrl }));
      }
    } catch (error) {
      console.warn('Failed to get preview URL for image:', block.imageUrl);
    }
  }, [previewUrls]);

  // Load preview URLs when blocks change
  useEffect(() => {
    blocks.forEach(block => {
      if (block.type === 'image' && block.imageKey && !previewUrls[block.id]) {
        getPreviewUrl(block);
      }
    });
  }, [blocks, getPreviewUrl, previewUrls]);

  // Expose methods to parent components
  React.useImperativeHandle(ref, () => ({
    addBlock: addBlockFromToolbar,
    addImageBlock: addImageBlockFromToolbar,
    getCurrentBlockType,
    transformCurrentBlock,
    insertText: insertTextAtCurrentBlock,
    undo: undoLastChange,
  }), [addBlockFromToolbar, addImageBlockFromToolbar, getCurrentBlockType, transformCurrentBlock, insertTextAtCurrentBlock, undoLastChange]);

  const getTextStyle = (type: BlockType) => {
    const baseStyle = { color: colors.text };
    
    switch (type) {
      case 'title':
        return [baseStyle, { fontSize: 32, fontWeight: '700', lineHeight: 40 }];
      case 'heading1':
        return [baseStyle, { fontSize: 24, fontWeight: '600', lineHeight: 32 }];
      case 'heading2':
        return [baseStyle, { fontSize: 20, fontWeight: '600', lineHeight: 28 }];
      case 'heading3':
        return [baseStyle, { fontSize: 18, fontWeight: '600', lineHeight: 24 }];
      case 'quote':
        return [baseStyle, { fontSize: 16, fontStyle: 'italic', lineHeight: 24 }];
      case 'code':
        return [baseStyle, { fontSize: 14, fontFamily: 'monospace', lineHeight: 20 }];
      default:
        return [baseStyle, { fontSize: 16, lineHeight: 24 }];
    }
  };

  const getBlockPlaceholder = (type: BlockType) => {
    switch (type) {
      case 'title': return 'Untitled';
      case 'heading1': return 'Heading 1';
      case 'heading2': return 'Heading 2';
      case 'heading3': return 'Heading 3';
      case 'bullet': return 'List item';
      case 'task': return 'To-do';
      case 'quote': return 'Empty quote';
      case 'code': return 'Code';
      case 'image': return 'Image caption...';
      default: return placeholder;
    }
  };

  const renderBlock = (block: Block, index: number) => {
    const isActive = activeBlockId === block.id;
    const hasContent = block.content.length > 0;
    const previewUrl = previewUrls[block.id];
    
    // Visual feedback colors based on block type
    const getBlockBackgroundColor = () => {
      if (!isActive) return 'transparent';
      
      switch (block.type) {
        case 'title': return `${colors.primary}15`;
        case 'heading1': return '#3b82f615';
        case 'heading2': return '#10b98115';
        case 'heading3': return '#f59e0b15';
        case 'quote': return `${colors.textSecondary}10`;
        case 'code': return `${colors.backgroundSecondary}`;
        default: return 'transparent';
      }
    };
    
    return (
      <View key={`${block.id}-${renderKey}`} style={[
        styles.blockContainer,
        { backgroundColor: getBlockBackgroundColor() }
      ]}>
        <View style={styles.blockRow}>
          {/* Block Content */}
          <View style={styles.blockContent}>
            {/* Image block rendering */}
            {block.type === 'image' && block.imageUrl && (
              <View style={styles.imageBlockContainer}>
                <Image
                  source={{ uri: previewUrl || block.imageUrl }}
                  style={styles.imageBlock}
                  contentFit="cover"
                  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                />
              </View>
            )}
            
            {/* Special prefix for bullet and task */}
            <View style={styles.blockInputContainer}>
              {block.type === 'bullet' && (
                <Text style={[styles.bulletPrefix, { color: colors.text }]}>•</Text>
              )}
              {block.type === 'task' && (
                <View style={[
                  styles.taskCheckbox, 
                  { 
                    borderColor: colors.textSecondary,
                    backgroundColor: colors.background 
                  }
                ]} />
              )}
              {block.type === 'quote' && (
                <View style={[styles.quoteBar, { backgroundColor: colors.textSecondary }]} />
              )}
              
              <TextInput
                key={`${block.id}-${renderKey}`}
                ref={(ref) => {
                  if (ref) {
                    inputRefs.current[block.id] = ref;
                  }
                }}
                style={[
                  styles.blockInput,
                  getTextStyle(block.type),
                  block.type === 'code' && { backgroundColor: colors.backgroundSecondary, padding: Spacing.sm, borderRadius: Radius.sm },
                  block.type === 'quote' && { paddingLeft: Spacing.md },
                  block.type === 'task' && { marginLeft: Spacing.xs },
                  block.type === 'image' && { fontSize: 14, fontStyle: 'italic' }
                ]}
                placeholder={getBlockPlaceholder(block.type)}
                placeholderTextColor={colors.textSecondary}
                value={block.content}
                onChangeText={(text) => updateBlockContent(block.id, text)}
                onFocus={() => setActiveBlockId(block.id)}
                onSubmitEditing={() => handleBlockSubmit(block.id)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace') {
                    handleBackspace(block.id, block.content);
                  }
                  if (nativeEvent.key === 'Enter') {
                    if (block.type === 'title' || block.type === 'task' || block.type === 'bullet') {
                      handleBlockSubmit(block.id);
                    }
                  }
                }}
                multiline={block.type !== 'title' && block.type !== 'task' && block.type !== 'bullet'}
                blurOnSubmit={block.type === 'title' || block.type === 'task' || block.type === 'bullet'}
                returnKeyType={block.type === 'title' || block.type === 'task' || block.type === 'bullet' ? 'next' : 'default'}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {blocks.map(renderBlock)}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  blockContainer: {
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  blockContent: {
    flex: 1,
    position: 'relative',
  },
  blockInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    minHeight: 28,
  },
  bulletPrefix: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 0,
    marginRight: Spacing.sm,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: Spacing.md,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    marginRight: Spacing.sm,
    alignSelf: 'stretch',
    minHeight: 24,
  },
  blockInput: {
    flex: 1,
    padding: 0,
    textAlignVertical: 'top',
    minHeight: 24,
  },
  imageBlockContainer: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  imageBlock: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
  },
});