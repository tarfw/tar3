# Selective Sync Strategy for TAR Application

## Overview
This document outlines a selective sync strategy to minimize sync costs while maintaining the benefits of cloud storage where needed.

## Table Categorization

### Sync to Cloud (Collaborative/Real-time)
- `notes` - Only if real-time collaboration is needed

### Local-Only (User-Specific)
- `items` - User's product catalog
- `variants` - Product variants
- `opgroups` - Option groups
- `opvalues` - Option values

## Implementation Plan

### 1. Cloud-Only Tables Approach
For tables that don't require real-time collaboration:
- Store data in user-specific Turso databases
- Access via direct API calls when needed
- No local caching/sync unless explicitly needed

### 2. Selective Local Caching
For performance-critical operations:
- Cache frequently accessed data locally
- Implement manual refresh mechanisms
- No automatic sync to reduce costs

### 3. Data Access Patterns

#### For Local-Only Tables (items, variants, etc.)
```typescript
// Direct Turso database queries
const getItems = async (userId: string) => {
  const db = createClient({
    url: userTursoUrl,
    authToken: userTursoAuthToken
  });
  
  return await db.execute("SELECT * FROM items ORDER BY id DESC");
};
```

#### For Synced Tables (if needed)
```typescript
// Implement only for tables requiring real-time collaboration
const syncNotes = async (userId: string) => {
  // Only implement sync for tables that truly need it
  // This would involve local SQLite + Turso sync
};
```

## Benefits of This Approach

1. **Reduced Sync Costs**: Only syncing tables that truly need real-time collaboration
2. **Lower Complexity**: Simplified data management for user-specific data
3. **Better Performance**: Direct database queries for most operations
4. **Flexible Scaling**: Easy to add sync to specific tables if requirements change

## Implementation Steps

1. Modify HybridDbContext to distinguish between synced and local-only tables
2. Update data access methods to use direct Turso queries for local-only tables
3. Implement selective caching strategies for performance
4. Remove unused sync infrastructure to reduce complexity