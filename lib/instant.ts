import { i, id, init, InstaQLEntity } from '@instantdb/react-native';

// Import required React Native dependencies
import 'react-native-get-random-values';

// App ID from your Instant DB dashboard
const APP_ID = '9e8cde29-5ce0-4a73-91c3-0019a469001e';

// Simplified schema with just two entities for best performance
const schema = i.schema({
  entities: {
    // Issues (main entity)
    issues: i.entity({
      id: i.string(),
      title: i.string(),
      description: i.string().optional(),
      identifier: i.string().indexed(), // e.g., 'ISS-123'
      priority: i.number().indexed(), // 1-4 (1=urgent, 2=high, 3=medium, 4=low)
      status: i.string().indexed(), // 'backlog', 'todo', 'in-progress', 'done'
      statusColor: i.string(), // hex color for the status
      assigneeId: i.string().optional().indexed(),
      creatorId: i.string().indexed(),
      createdAt: i.date().indexed(),
      updatedAt: i.date().indexed(),
      dueDate: i.date().optional().indexed(),
    }),

    // Comments
    comments: i.entity({
      id: i.string(),
      body: i.string(),
      issueId: i.string().indexed(),
      authorId: i.string().indexed(),
      createdAt: i.date().indexed(),
      updatedAt: i.date().indexed(),
    }),
  },
});

// Type exports
export type Issue = InstaQLEntity<typeof schema, 'issues'>;
export type Comment = InstaQLEntity<typeof schema, 'comments'>;

// Initialize the database
export const db = init({ appId: APP_ID, schema });

// Export InstantDB's ID generation function
export { id };

// Helper functions for common queries
export const queries = {
  // Get all issues
  getAllIssues: () => ({
    issues: {
      $: {
        order: { updatedAt: 'desc' },
      },
    },
  }),

  // Get issue details with comments
  getIssueDetails: (issueId: string) => ({
    issues: {
      $: { where: { id: issueId } },
    },
    comments: {
      $: {
        where: { issueId },
        order: { createdAt: 'asc' },
      },
    },
  }),

  // Get user's assigned issues
  getMyIssues: (userId: string) => ({
    issues: {
      $: {
        where: { assigneeId: userId },
        order: { updatedAt: 'desc' },
      },
    },
  }),
};
