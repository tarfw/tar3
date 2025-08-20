# Instant DB Architecture Documentation

## Overview
This document outlines the multi-tenant Instant DB architecture used in our application, which consists of a foundational database and user-specific app instances.

## Foundation Database ("tar")

### Configuration
- **App ID**: `9e8cde29-5ce0-4a73-91c3-0019a469001e`
- **Environment Variable**: `EXPO_PUBLIC_INSTANT_APP_ID`
- **Purpose**: Centralized user management and app registry

### Schema (`instant.schema.ts`)
```typescript
const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    app: i.entity({
      appid: i.string().optional(),
    }),
  },
  links: {
    app$users: {
      forward: {
        on: "app",
        has: "many",
        label: "$users",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "app",
      },
    },
  },
});
```

### Key Entities
- **`$users`**: Stores authenticated user data
  - `email`: User's email address (unique, indexed, optional)
- **`app`**: Registry of user-created apps
  - `appid`: Reference to the user's Instant Platform app ID
- **`$files`**: File storage references
  - `path`: Unique file path
  - `url`: File URL

### Relationships
- **`app$users`**: Many-to-many relationship linking apps to users
  - Each user can be linked to their personal app
  - Supports future multi-user app scenarios

## User-Specific Apps

### Creation Process
1. User authenticates → stored in foundation DB `$users` entity
2. User creates app via Instant Platform API (limited to one per user)
3. App ID stored in foundation DB `app` entity and linked to user
4. User can add "agents" (entities) to their personal app

### Implementation (`app/agents.tsx`)

#### Key Components
- **InstantPlatformService**: Wrapper for Instant Platform API
- **App Templates**: Pre-defined schemas for different use cases
- **Entity Management**: Dynamic schema updates for adding "agents"

#### App Templates
1. **Todo App**: Task management entities (todos, users)
2. **Chat App**: Messaging entities (messages, channels, users)
3. **Custom App**: Blank app for custom entities

#### User Limitations
- **One app per user**: Enforced in UI and logic
- **Unlimited agents**: Users can add unlimited entities to their app
- **Schema flexibility**: Dynamic entity creation with custom fields

### Platform Service (`lib/instantPlatformService.ts`)

#### Key Methods
```typescript
// App Management
async getApps(options?: { includeSchema?: boolean; includePerms?: boolean }): Promise<InstantApp[]>
async createApp(params: { title: string; schema?: InstantSchemaDef; perms?: InstantRules }): Promise<InstantApp>
async updateApp(appId: string, params: { title?: string }): Promise<InstantApp>
async deleteApp(appId: string): Promise<void>

// Schema Management
async getSchema(appId: string): Promise<InstantSchemaDef>
async schemaPush(appId: string, schema: InstantSchemaDef): Promise<SchemaStep[]>

// Permissions Management
async getPerms(appId: string): Promise<InstantRules>
async pushPerms(appId: string, perms: InstantRules): Promise<void>
```

#### Authentication
- Uses platform tokens stored in AsyncStorage
- Environment variable: `EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN`

## Data Flow

### User Registration/Login
1. User authenticates through auth system
2. User data stored/retrieved from foundation DB `$users` entity
3. Check for existing app in `app` entity linked to user

### App Creation
1. User initiates app creation in `app/agents.tsx`
2. `InstantPlatformService.createApp()` called with template
3. New app created via Instant Platform API
4. App ID stored in foundation DB:
   ```typescript
   await db.transact([
     db.tx.app[appRecordId].update({
       appid: newApp.id
     }).link({ $users: user.id })
   ]);
   ```

### Agent (Entity) Creation
1. User adds new entity through UI
2. Current schema retrieved from user's app
3. New entity definition created with custom fields
4. Schema updated via `schemaPush()`

## Key Files

### Core Configuration
- `instant.schema.ts`: Foundation database schema
- `lib/instant.ts`: Foundation DB connection and queries
- `.env.example`: Environment variables template

### Platform Integration
- `lib/instantPlatformService.ts`: Instant Platform API wrapper
- `app/agents.tsx`: Main UI for app/agent management

### Authentication
- `contexts/AuthContext.tsx`: User authentication context

## Architecture Benefits

### Scalability
- **Isolated user data**: Each user gets their own database instance
- **Centralized management**: Foundation DB handles user registry
- **Resource efficiency**: Only active users consume platform resources

### Security
- **Data isolation**: User data completely separated
- **Permission control**: Each app has its own permission rules
- **Access control**: Foundation DB controls app access

### Flexibility
- **Custom schemas**: Users can define their own entities
- **Template system**: Quick start with pre-built schemas
- **Dynamic updates**: Schema changes without downtime

## Future Considerations

### Potential Enhancements
1. **Multi-user apps**: Allow users to share apps
2. **App templates marketplace**: Community-contributed templates
3. **Advanced permissions**: Fine-grained access control
4. **Data migration**: Tools for moving between apps
5. **Analytics**: Usage tracking and insights

### Scaling Considerations
1. **Foundation DB limits**: Monitor entity counts and relationships
2. **Platform API limits**: Rate limiting and quota management
3. **Storage optimization**: File management and cleanup
4. **Performance monitoring**: Query optimization and caching

## Troubleshooting

### Common Issues
1. **Missing environment variables**: Check `.env` file configuration
2. **Platform token issues**: Verify token validity and permissions
3. **Schema conflicts**: Ensure entity names don't conflict
4. **Link relationship errors**: Verify user-app associations

### Debug Tools
- Foundation DB queries in `lib/instant.ts`
- Platform API error logging in `instantPlatformService.ts`
- User context debugging in `AuthContext.tsx`