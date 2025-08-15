import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useHybridDb } from '@/contexts/HybridDbContext';
import { useThemeColor } from '@/hooks/useThemeColor';

export function SyncSettings() {
  const {
    syncWithTurso,
    syncWithInstant,
    toggleAutoSync,
    isSyncing,
    isAutoSyncEnabled,
    localIssues,
    localComments,
  } = useHybridDb();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card') || '#f8f9fa';
  const borderColor = useThemeColor({}, 'border') || '#e1e5e9';

  const [syncing, setSyncing] = useState<'turso' | 'instant' | null>(null);

  const handleManualTursoSync = async () => {
    setSyncing('turso');
    try {
      await syncWithTurso();
      Alert.alert('Success', 'Successfully synced with Turso database');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync with Turso database');
      console.error('Turso sync error:', error);
    } finally {
      setSyncing(null);
    }
  };

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

  const handleAutoSyncToggle = (value: boolean) => {
    toggleAutoSync(value);
    if (value) {
      Alert.alert(
        'Auto-sync Enabled',
        'Your data will automatically sync every 30 seconds when connected to the internet.'
      );
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

      {/* Auto-sync toggle */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            color: textColor,
            fontWeight: '500',
          }}>
            Auto-sync
          </Text>
          <Text style={{
            fontSize: 14,
            color: textColor + '80',
            marginTop: 2,
          }}>
            Automatically sync every 30 seconds
          </Text>
        </View>
        <Switch
          value={isAutoSyncEnabled}
          onValueChange={handleAutoSyncToggle}
          trackColor={{ false: borderColor, true: tintColor + '40' }}
          thumbColor={isAutoSyncEnabled ? tintColor : '#f4f3f4'}
        />
      </View>

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
          onPress={handleManualTursoSync}
          disabled={syncing === 'turso' || isSyncing}
          style={{
            flex: 1,
            backgroundColor: syncing === 'turso' ? borderColor : tintColor,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            opacity: (syncing === 'turso' || isSyncing) ? 0.6 : 1,
          }}
        >
          {syncing === 'turso' ? (
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{
            color: 'white',
            fontWeight: '500',
            fontSize: 14,
          }}>
            {syncing === 'turso' ? 'Syncing...' : 'Sync Turso'}
          </Text>
        </TouchableOpacity>

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
            {syncing === 'instant' ? 'Syncing...' : 'Sync Instant'}
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
        Turso provides offline-first local storage with cloud sync.{'\n'}
        Instant DB enables real-time collaboration features.
      </Text>
    </View>
  );
}
