# Selective Sync Strategy Implementation

## Overview

This document explains the implementation of a selective sync strategy for the TAR application that minimizes sync costs while maintaining the benefits of cloud storage where needed.

## Key Changes

### 1. HybridDbContext Refactoring

The `HybridDbContext` has been refactored to support selective synchronization:

- **Local-Only Tables**: `items`, `variants`, `opgroups`, `opvalues` are treated as local-only by default
- **Cloud Access Methods**: Added methods to directly access cloud data when needed
- **Selective Sync**: Only `notes` table (if needed) would be synced for real-time collaboration

### 2. Turso Context Updates

The `TursoContext` now provides proper configuration methods:

- `configureTurso(url, authToken)`: Properly configures Turso access
- `clearTursoConfig()`: Clears Turso configuration when needed

### 3. AuthContext Integration

The `AuthContext` now properly configures Turso when a user logs in:

- Automatically configures Turso with user-specific database URL and auth token
- Maintains backward compatibility with existing code

## Implementation Details

### Local-Only Approach

For tables that don't require real-time collaboration:

1. Data is stored locally in SQLite
2. Cloud access is available via direct Turso queries when needed
3. No automatic synchronization to reduce costs

### Cloud Access Pattern

```typescript
// Direct Turso database queries for cloud access
const { getCloudItems } = useHybridDb();
const items = await getCloudItems();
```

### Selective Sync (If Needed)

For tables requiring real-time collaboration:

1. Implement local SQLite storage
2. Add synchronization logic to keep local and cloud in sync
3. Use efficient sync algorithms to minimize data transfer

## Benefits

1. **Reduced Sync Costs**: Only syncing tables that truly need real-time collaboration
2. **Lower Complexity**: Simplified data management for user-specific data
3. **Better Performance**: Direct database queries for most operations
4. **Flexible Scaling**: Easy to add sync to specific tables if requirements change

## Usage Examples

### Accessing Local Data

```typescript
const { getAllLocalItems, getLocalItem } = useHybridDb();
const items = getAllLocalItems();
const item = getLocalItem(123);
```

### Accessing Cloud Data

```typescript
const { getCloudItems } = useHybridDb();
const items = await getCloudItems();
```

### Creating Cloud Data

```typescript
const { createCloudItem } = useHybridDb();
const newItem = await createCloudItem({
  name: 'New Item',
  category: 'Electronics',
  optionIds: '[]'
});
```

## Future Considerations

1. **Selective Sync Implementation**: If real-time collaboration becomes needed for specific tables, implement sync only for those tables
2. **Caching Strategy**: Implement intelligent caching for frequently accessed data
3. **Offline Support**: Add offline support for cloud data access with automatic sync when online