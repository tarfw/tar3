import { id, init } from '@instantdb/react-native';
import 'react-native-get-random-values'; // Required for crypto.randomUUID in React Native

// You'll need to get your APP_ID from https://instantdb.com/dash
const APP_ID = process.env.EXPO_PUBLIC_INSTANT_APP_ID || '__YOUR_APP_ID__';

export const db = init({ appId: APP_ID });

// Export InstantDB's built-in id function
export { id };

// Types
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  issueId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

// Queries
export const queries = {
  getIssueDetails: (issueId: string) => ({
    issues: {
      $: {
        where: {
          id: issueId,
        },
      },
    },
    comments: {
      $: {
        where: {
          issueId: issueId,
        },
      },
    },
  }),
  
  getAllIssues: () => ({
    issues: {},
  }),
  
  getMyIssues: (userId: string) => ({
    issues: {
      $: {
        where: {
          assigneeId: userId,
        },
      },
    },
  }),
};
