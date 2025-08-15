import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useHybridDb } from '@/contexts/HybridDbContext';
import { HybridDataService, getRelativeTime } from '@/lib/hybridDataService';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from './IconSymbol';

// Example component showing how to use the hybrid database system
export function HybridIssueDemo() {
  const hybridDb = useHybridDb();
  const [loading, setLoading] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';

  // Get issues from hybrid database (local-first)
  const issues = HybridDataService.getAllIssues(hybridDb);

  const handleCreateDemoIssue = async () => {
    setLoading(true);
    try {
      const newIssue = await HybridDataService.createIssue(hybridDb, {
        title: `Demo Issue ${Date.now()}`,
        description: 'This is a demo issue created using the hybrid database system',
        creatorId: 'demo-user',
        priority: Math.floor(Math.random() * 4) + 1, // Random priority 1-4
        status: 'todo',
      });

      if (newIssue) {
        Alert.alert(
          'Success!', 
          `Created issue "${newIssue.title}" with ID: ${newIssue.identifier}\n\nIt's stored locally and will sync to the cloud when connected.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create demo issue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId: string, title: string) => {
    Alert.alert(
      'Delete Issue',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await HybridDataService.deleteIssue(hybridDb, issueId);
              Alert.alert('Success', 'Issue deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete issue');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (issueId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'todo' ? 'done' : 'todo';
    const statusColor = newStatus === 'done' ? '#10b981' : '#94A3B8';
    
    try {
      await HybridDataService.updateIssueStatus(hybridDb, issueId, newStatus, statusColor);
    } catch (error) {
      Alert.alert('Error', 'Failed to update issue status');
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#ef4444'; // red - urgent
      case 2: return '#f97316'; // orange - high
      case 3: return '#eab308'; // yellow - medium
      case 4: return '#22c55e'; // green - low
      default: return '#94a3b8';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'Unknown';
    }
  };

  const renderIssueItem = ({ item }: { item: any }) => (
    <View style={{
      backgroundColor: cardColor,
      padding: 12,
      marginVertical: 4,
      marginHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      {/* Status toggle button */}
      <TouchableOpacity
        onPress={() => handleToggleStatus(item.id, item.status)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: item.status === 'done' ? '#10b981' : 'transparent',
          borderWidth: 2,
          borderColor: item.status === 'done' ? '#10b981' : '#94a3b8',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {item.status === 'done' && (
          <IconSymbol size={12} name="checkmark" color="white" />
        )}
      </TouchableOpacity>

      {/* Issue content */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          color: textColor,
          textDecorationLine: item.status === 'done' ? 'line-through' : 'none',
          opacity: item.status === 'done' ? 0.6 : 1,
        }}>
          {item.title}
        </Text>
        
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 4,
          gap: 8,
        }}>
          <Text style={{
            fontSize: 12,
            color: textColor + '80',
          }}>
            {item.identifier}
          </Text>
          
          <View style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: getPriorityColor(item.priority) + '20',
          }}>
            <Text style={{
              fontSize: 10,
              color: getPriorityColor(item.priority),
              fontWeight: '600',
            }}>
              {getPriorityText(item.priority)}
            </Text>
          </View>

          {!item.syncedToInstant && (
            <View style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: '#f59e0b20',
            }}>
              <Text style={{
                fontSize: 10,
                color: '#f59e0b',
                fontWeight: '600',
              }}>
                Pending Sync
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        onPress={() => handleDeleteIssue(item.id, item.title)}
        style={{
          padding: 8,
          marginLeft: 8,
        }}
      >
        <IconSymbol size={16} name="trash" color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{
      backgroundColor: cardColor,
      margin: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: textColor,
          marginBottom: 4,
        }}>
          Hybrid Database Demo
        </Text>
        <Text style={{
          fontSize: 14,
          color: textColor + '80',
        }}>
          Local issues: {issues.length} • Unsynced: {issues.filter(i => !i.syncedToInstant).length}
        </Text>
      </View>

      {/* Create demo issue button */}
      <View style={{
        padding: 16,
        borderBottomWidth: issues.length > 0 ? 1 : 0,
        borderBottomColor: borderColor,
      }}>
        <TouchableOpacity
          onPress={handleCreateDemoIssue}
          disabled={loading}
          style={{
            backgroundColor: loading ? borderColor : tintColor,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <IconSymbol 
            size={16} 
            name={loading ? "hourglass" : "plus"} 
            color="white" 
            style={{ marginRight: 8 }} 
          />
          <Text style={{
            color: 'white',
            fontWeight: '500',
            fontSize: 16,
          }}>
            {loading ? 'Creating...' : 'Create Demo Issue'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Issues list */}
      {issues.length > 0 ? (
        <FlatList
          data={issues}
          renderItem={renderIssueItem}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 300 }}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      ) : (
        <View style={{
          padding: 24,
          alignItems: 'center',
        }}>
          <IconSymbol size={48} name="tray" color={textColor + '40'} />
          <Text style={{
            fontSize: 16,
            color: textColor + '60',
            marginTop: 8,
            textAlign: 'center',
          }}>
            No issues yet{'\n'}Create your first demo issue above
          </Text>
        </View>
      )}
    </View>
  );
}
