import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export function SyncSettings() {
  const {
    syncWithInstant,
    isSyncing,
    localIssues,
    localComments,
  } = useHybridDb();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';

  const [syncing, setSyncing] = useState<'instant' | null>(null);

  const handleManualInstantSync = async () => {
    setSyncing('instant');
    try {
      await syncWithInstant();
      Alert.alert('Success', 'Successfully synced with Instant DB');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with Instant DB');
      console.error('Instant sync error:', error);
    } finally {
      setSyncing(null);
    }
  };

  // Count unsynced items
  const unsyncedIssuesCount = localIssues.filter(issue => !issue.syncedToInstant).length;
  const unsyncedCommentsCount = localComments.filter(comment => !comment.syncedToInstant).length;

  return (
    <View style={{
      backgroundColor: cardColor,
      padding: 16,
      margin: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderColor,
    }}>
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: textColor,
        marginBottom: 16,
      }}>
        Database Synchronization
      </Text>

      {/* Sync status */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        padding: 12,
        backgroundColor: backgroundColor + '40',
        borderRadius: 8,
      }}>
        <View>
          <Text style={{
            fontSize: 14,
            color: textColor + '80',
          }}>
            Local Issues: {localIssues.length}
          </Text>
          <Text style={{
            fontSize: 14,
            color: textColor + '80',
          }}>
            Local Comments: {localComments.length}
          </Text>
        </View>
        <View>
          <Text style={{
            fontSize: 14,
            color: unsyncedIssuesCount > 0 ? '#f59e0b' : '#10b981',
            fontWeight: '500',
          }}>
            Unsynced Issues: {unsyncedIssuesCount}
          </Text>
          <Text style={{
            fontSize: 14,
            color: unsyncedCommentsCount > 0 ? '#f59e0b' : '#10b981',
            fontWeight: '500',
          }}>
            Unsynced Comments: {unsyncedCommentsCount}
          </Text>
        </View>
      </View>

      {/* Manual sync buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={handleManualInstantSync}
          disabled={syncing === 'instant' || isSyncing || unsyncedIssuesCount === 0}
          style={{
            flex: 1,
            backgroundColor: syncing === 'instant' ? borderColor : (unsyncedIssuesCount === 0 ? borderColor : '#8b5cf6'),
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: (syncing === 'instant' || isSyncing) ? 0.6 : 1,
          }}
        >
          {syncing === 'instant' ? (
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{
            color: 'white',
            fontWeight: '500',
            fontSize: 14,
          }}>
            {syncing === 'instant' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info text */}
      <Text style={{
        fontSize: 12,
        color: textColor + '60',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 16,
      }}>
        Sync enables real-time collaboration features.
      </Text>
    </View>
  );
}