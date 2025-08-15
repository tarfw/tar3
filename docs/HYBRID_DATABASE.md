# Hybrid Database System Documentation

This document explains the hybrid database system that combines Turso (local-first SQLite with cloud sync) and Instant DB (real-time collaboration) in your tar3 application.

## Architecture Overview

The application now supports two database systems working in harmony:

### 1. **Turso (Local-First with Cloud Sync)**
- **Primary storage**: Local SQLite database
- **Cloud sync**: Automatic synchronization with Turso cloud
- **Offline capability**: Full functionality without internet
- **Use case**: Primary data storage, offline-first operations

### 2. **Instant DB (Real-time Collaboration)**
- **Real-time sync**: Live updates across connected clients
- **Collaborative features**: Multi-user real-time interactions
- **Use case**: Real-time notifications, live collaboration features

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in your project root with your Turso credentials:

```env
# Turso Database Configuration
EXPO_PUBLIC_TURSO_DB_URL=libsql://your-database-url.turso.io
EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN=your_auth_token_here

# Optional: Your existing Instant DB configuration
EXPO_PUBLIC_INSTANT_APP_ID=your_instant_app_id
```

### 2. Turso Setup

1. **Create a Turso account** at [turso.tech](https://turso.tech)
2. **Create a new database group** (e.g., "tar3-offline")
3. **Create a database** in that group
4. **Generate an auth token** with read/write permissions
5. **Copy the database URL and token** to your `.env.local` file

### 3. Database Schema

The hybrid system automatically creates these tables:

#### Issues Table
```sql
CREATE TABLE issues (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  identifier TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'todo',
  statusColor TEXT NOT NULL DEFAULT '#94A3B8',
  assigneeId TEXT,
  creatorId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  dueDate TEXT,
  syncedToInstant BOOLEAN NOT NULL DEFAULT 0
);
```

#### Comments Table
```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL,
  issueId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  syncedToInstant BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE
);
```

## How It Works

### Data Flow

1. **Create/Update Operations**:
   - Data is immediately saved to local Turso database
   - Marked as "not synced to Instant"
   - Local operations complete instantly (offline-first)

2. **Turso Cloud Sync**:
   - Automatically syncs local changes to Turso cloud
   - Enables cross-device synchronization
   - Works in background when internet is available

3. **Instant DB Sync**:
   - Unsynced items are pushed to Instant DB for real-time features
   - Enables live collaboration and notifications
   - Happens after local storage is complete

### Sync Strategy

```
Local SQLite (Turso) ←→ Turso Cloud ←→ Other Devices
          ↓
    Instant DB (Real-time features)
```

## Usage Examples

### Using the Hybrid Database Context

```typescript
import { useHybridDb } from '@/contexts/HybridDbContext';
import { HybridDataService } from '@/lib/hybridDataService';

function MyComponent() {
  const hybridDb = useHybridDb();

  // Create an issue (local-first)
  const createIssue = async () => {
    const newIssue = await HybridDataService.createIssue(hybridDb, {
      title: 'New Issue',
      description: 'Issue description',
      creatorId: 'user-123',
      priority: 2,
    });
  };

  // Get all issues (from local storage)
  const issues = HybridDataService.getAllIssues(hybridDb);

  // Manual sync operations
  const syncToTurso = () => hybridDb.syncWithTurso();
  const syncToInstant = () => hybridDb.syncWithInstant();
  
  // Auto-sync control
  const enableAutoSync = () => hybridDb.toggleAutoSync(true);

  return (
    // Your component JSX
  );
}
```

### Using the Sync Settings Component

The `SyncSettings` component provides a UI for managing synchronization:

```typescript
import { SyncSettings } from '@/components/ui/SyncSettings';

// Add to any screen
<SyncSettings />
```

## Features

### ✅ Offline-First
- Full functionality without internet connection
- Local SQLite database for primary storage
- Automatic conflict resolution

### ✅ Cloud Synchronization
- Background sync with Turso cloud
- Cross-device data synchronization
- Automatic migration management

### ✅ Real-time Collaboration
- Live updates via Instant DB
- Real-time notifications
- Multi-user collaboration features

### ✅ Automatic Sync Management
- Auto-sync every 30 seconds (configurable)
- Manual sync controls
- Sync status indicators

### ✅ Graceful Degradation
- Works without Turso configuration
- Falls back to Instant DB only
- No breaking changes to existing functionality

## Performance Considerations

### Local-First Benefits
- **Instant response**: All operations complete immediately
- **Offline capability**: Full functionality without internet
- **Reduced bandwidth**: Only sync changes, not full datasets

### Sync Optimization
- **Incremental sync**: Only unsynced items are processed
- **Background operations**: Sync doesn't block UI
- **Conflict resolution**: Automatic handling of data conflicts

## Troubleshooting

### Common Issues

1. **"Turso DB URL and Auth Token must be set"**
   - Ensure `.env.local` file exists with correct credentials
   - Restart development server after adding environment variables

2. **Sync failures**
   - Check internet connection
   - Verify Turso credentials are valid
   - Check console for detailed error messages

3. **Missing data after sync**
   - Ensure database migration completed successfully
   - Check sync status in the SyncSettings component
   - Try manual sync to troubleshoot specific issues

### Debug Mode

Enable detailed logging by checking browser/device console:
- Turso sync operations log success/failure
- Migration status is logged during startup
- Sync intervals show activity timestamps

## Migration from Instant-Only

If you're migrating from Instant DB only:

1. **No breaking changes**: Existing Instant DB functionality continues to work
2. **Gradual migration**: Start using `HybridDataService` for new features
3. **Data preservation**: All existing data remains accessible
4. **Optional Turso**: System works with or without Turso configuration

## Best Practices

1. **Use `HybridDataService`** for all new database operations
2. **Enable auto-sync** for best user experience
3. **Handle offline states** gracefully in your UI
4. **Monitor sync status** using the provided components
5. **Test offline scenarios** during development

## API Reference

### HybridDataService Methods

- `createIssue(hybridDb, data)` - Create new issue (local-first)
- `createComment(hybridDb, data)` - Create new comment (local-first)
- `updateIssueStatus(hybridDb, id, status)` - Update issue status
- `updateIssuePriority(hybridDb, id, priority)` - Update issue priority
- `assignIssue(hybridDb, id, assigneeId)` - Assign issue to user
- `deleteIssue(hybridDb, id)` - Delete issue and related comments
- `getAllIssues(hybridDb)` - Get all issues from local storage
- `getIssueById(hybridDb, id)` - Get specific issue
- `getCommentsForIssue(hybridDb, issueId)` - Get comments for issue
- `searchIssues(hybridDb, query)` - Search issues by title/description
- `getSyncStats(hybridDb)` - Get synchronization statistics

### Sync Control Methods

- `syncWithTurso()` - Manual sync with Turso cloud
- `syncWithInstant()` - Manual sync unsynced items to Instant DB
- `toggleAutoSync(enabled)` - Enable/disable automatic synchronization

This hybrid system provides the best of both worlds: offline-first reliability with real-time collaboration capabilities.
