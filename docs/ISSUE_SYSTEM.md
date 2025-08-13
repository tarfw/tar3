# Linear-like Issue Management System

This document outlines the comprehensive issue creation and status management system implemented in this React Native app, designed to work like Linear.

## 🏗️ System Architecture

### Core Components

1. **Home Screen (`app/(tabs)/index.tsx`)**
   - Displays issues grouped by status
   - Tab-based filtering (Assigned, Created, Subscribed)
   - Real-time status updates via modal picker
   - Floating action button for creating new issues

2. **Issue Creation Screen (`app/create-issue.tsx`)**
   - Linear-style interface for creating new issues
   - Priority selection (Urgent, High, Medium, Low)
   - Project context display
   - Auto-assignment of default status

3. **Issue Detail Screen (`app/issue/[id].tsx`)**
   - Full issue view with comments
   - Status and priority management
   - Comment system integration

4. **Status Picker (`components/ui/StatusPicker.tsx`)**
   - Modal for selecting issue statuses
   - Animated transitions
   - Visual status indicators

## 📊 Database Schema

### Issues Table
```typescript
issues: {
  id: string;
  title: string;
  description?: string;
  identifier: string; // e.g., 'LIN-123'
  priority: number; // 1-4 (1=urgent, 4=low)
  projectId: string;
  statusId: string;
  assigneeId?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}
```

### Issue Statuses Table
```typescript
issueStatuses: {
  id: string;
  name: string; // e.g., 'Todo', 'In Progress', 'Done'
  color: string; // hex color
  type: string; // 'backlog', 'unstarted', 'started', 'completed'
  position: number; // for ordering
  projectId: string;
  createdAt: Date;
}
```

### Projects Table
```typescript
projects: {
  id: string;
  name: string;
  key: string; // e.g., 'LIN'
  description?: string;
  icon?: string;
  color: string;
  status: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Key Features

### Issue Creation Flow
1. User taps the floating action button (+) on home screen
2. Navigate to create-issue screen
3. Fill in title, description, and select priority
4. System automatically assigns default status (first available)
5. Generate issue identifier (e.g., LIN-123)
6. Save to database with proper relationships

### Status Management
1. Issues are grouped by status type on home screen
2. Tap status icon to open status picker modal
3. Select new status with visual feedback
4. Real-time updates across the app
5. Smooth animations for better UX

### Home Screen Organization
- **Sections**: Backlog, Todo, In Progress, Done
- **Tabs**: Assigned (to user), Created (by user), Subscribed
- **Visual Elements**: Priority icons, status indicators, project context

## 🛠️ Service Layer

### DataService Class
Central service for all database operations:

```typescript
// Create new issue
DataService.createIssue({
  title: 'Fix login bug',
  description: 'Users cannot login...',
  projectId: 'project-id',
  creatorId: 'user-id',
  priority: 1
});

// Update issue status
DataService.updateIssueStatus(issueId, statusId);

// Initialize demo data
DataService.initializeDemoData();
```

### Real-time Updates
Using InstantDB's reactive queries:

```typescript
const { data } = db.useQuery({
  issues: {
    $: { order: { updatedAt: 'desc' } }
  },
  issueStatuses: {},
  projects: {}
});
```

## 🎨 UI/UX Features

### Linear-inspired Design
- Clean, minimal interface
- Proper spacing and typography
- Smooth animations and transitions
- Status colors and priority indicators
- Modal overlays with backdrop blur

### Priority System
- **Urgent (1)**: Red, blocking issues
- **High (2)**: Orange, important features
- **Medium (3)**: Gray, normal priority
- **Low (4)**: Light gray, nice-to-have

### Status Types
- **Backlog**: Planning and triage
- **Unstarted**: Ready to work
- **Started**: In progress
- **Completed**: Done and verified

## 📱 User Interactions

### Creating Issues
1. Tap floating action button
2. Enter issue title (required)
3. Add description (optional)
4. Select priority level
5. Tap "Create" to save

### Managing Status
1. Tap status icon on any issue
2. Modal opens with available statuses
3. Tap desired status to update
4. Modal closes with animation
5. Issue moves to appropriate section

### Viewing Details
1. Tap anywhere on issue row
2. Navigate to detail screen
3. View full information
4. Add comments
5. Change status/priority

## 🧪 Testing

Run the test system to verify functionality:

```typescript
import { IssueSystemTester } from './scripts/test-issue-system';

// Test all functionality
await IssueSystemTester.test();

// View current state
await IssueSystemTester.displayState();
```

## 🔧 Configuration

### Default Statuses
When creating a new project, these statuses are automatically created:
- Backlog (gray)
- Todo (light gray) 
- In Progress (blue)
- In Review (yellow)
- Done (green)

### Demo Data
Initialize with sample data:
- Demo team and project
- 5 sample issues with various priorities
- Complete status workflow
- Sample labels and notifications

## 🚦 Current Status

✅ **Completed Features**:
- Issue creation with proper validation
- Status management system
- Home screen with sections and tabs
- Real-time data updates
- Priority and status visual indicators
- Demo data initialization

🔄 **In Progress**:
- Enhanced issue detail screen
- Comment system improvements
- Assignment management
- Labels and tags system

📋 **Planned Features**:
- Issue search and filtering
- Bulk operations
- Issue dependencies
- Time tracking
- Team collaboration features

## 🐛 Troubleshooting

### Common Issues
1. **Modal not showing**: Check Modal/Pressable imports
2. **Status not updating**: Verify database transaction
3. **Issues not appearing**: Check query filters and user ID
4. **Demo data fails**: Ensure proper project/status creation

### Debug Tips
- Check console logs for database operations
- Use React DevTools to inspect component state
- Verify InstantDB connection and schema
- Test with different user IDs for filtering

---

This system provides a solid foundation for a Linear-like issue tracking experience in React Native, with room for future enhancements and customizations.
