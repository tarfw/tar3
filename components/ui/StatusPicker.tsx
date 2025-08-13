import { Colors } from '@/constants/Colors';
import { Radius, Spacing, TextStyles } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Issue, IssueStatus } from '@/lib/instant';
import React from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { IconSymbol } from './IconSymbol';

interface StatusPickerProps {
  visible: boolean;
  issue: Issue | null;
  statuses: IssueStatus[];
  animation: Animated.Value;
  onStatusUpdate: (statusId: string) => void;
  onClose: () => void;
}

export function StatusPicker({
  visible,
  issue,
  statuses,
  animation,
  onStatusUpdate,
  onClose,
}: StatusPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'completed': return 'checkmark.circle.fill';
      case 'started': return 'circle.fill';
      case 'unstarted': return 'circle';
      case 'backlog': return 'tray';
      case 'cancelled': return 'xmark.circle';
      default: return 'circle';
    }
  };

  const handleStatusSelect = (statusId: string) => {
    onStatusUpdate(statusId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.statusPicker,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              transform: [
                {
                  scale: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: animation,
            },
          ]}
        >
          <View style={[styles.statusPickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[TextStyles.h3, { color: colors.text }]}>
              Update Status
            </Text>
            <Text style={[TextStyles.body, { color: colors.textSecondary, marginTop: 4 }]}>
              {issue?.title}
            </Text>
          </View>
          
          <View style={styles.statusList}>
            {statuses
              .sort((a, b) => a.position - b.position)
              .map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[
                    styles.statusOption,
                    issue?.statusId === status.id && {
                      backgroundColor: colors.backgroundSecondary,
                    },
                  ]}
                  onPress={() => onStatusUpdate(status.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: status.color },
                    ]}
                  />
                  <IconSymbol
                    size={18}
                    name={getStatusIcon(status.type)}
                    color={status.color}
                    style={styles.statusOptionIcon}
                  />
                  <Text style={[TextStyles.body, { color: colors.text, flex: 1 }]}>
                    {status.name}
                  </Text>
                  {issue?.statusId === status.id && (
                    <IconSymbol
                      size={16}
                      name="checkmark"
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  statusPicker: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.xl,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  statusPickerHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  statusList: {
    maxHeight: 300,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusOptionIcon: {
    marginRight: Spacing.md,
  },
});