import { useHybridDb, LocalIssue, LocalComment } from '@/contexts/HybridDbContext';
import { DataService as InstantDataService } from './dataService';

// Enhanced data service that works with both Turso and Instant DB
export class HybridDataService {
  
  // Create issue using hybrid approach (local-first)
  static async createIssue(
    hybridDb: ReturnType<typeof useHybridDb>,
    data: {
      title: string;
      description?: string;
      creatorId: string;
      assigneeId?: string;
      priority?: number;
      status?: string;
      statusColor?: string;
      dueDate?: string;
    }
  ): Promise<LocalIssue | undefined> {
    // Generate simple identifier
    const issueNumber = Math.floor(Date.now() / 1000) % 10000;
    const identifier = `ISS-${issueNumber}`;

    const issueData = {
      title: data.title,
      description: data.description || null,
      identifier,
      priority: data.priority || 3,
      status: data.status || 'todo',
      statusColor: data.statusColor || '#94A3B8',
      assigneeId: data.assigneeId || null,
      creatorId: data.creatorId,
      dueDate: data.dueDate || null,
    };

    return await hybridDb.createIssue(issueData);
  }

  // Create comment using hybrid approach
  static async createComment(
    hybridDb: ReturnType<typeof useHybridDb>,
    data: {
      body: string;
      issueId: string;
      authorId: string;
    }
  ): Promise<LocalComment | undefined> {
    return await hybridDb.createComment(data);
  }

  // Update issue status
  static async updateIssueStatus(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string, 
    status: string, 
    statusColor?: string
  ): Promise<void> {
    await hybridDb.updateIssue(issueId, {
      status,
      statusColor: statusColor || '#94A3B8',
    });
  }

  // Update issue priority
  static async updateIssuePriority(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string, 
    priority: number
  ): Promise<void> {
    await hybridDb.updateIssue(issueId, { priority });
  }

  // Assign issue to user
  static async assignIssue(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string, 
    assigneeId: string | null
  ): Promise<void> {
    await hybridDb.updateIssue(issueId, { assigneeId });
  }

  // Delete issue
  static async deleteIssue(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string
  ): Promise<void> {
    await hybridDb.deleteIssue(issueId);
  }

  // Delete comment
  static async deleteComment(
    hybridDb: ReturnType<typeof useHybridDb>,
    commentId: string
  ): Promise<void> {
    await hybridDb.deleteComment(commentId);
  }

  // Get all issues (from local storage first)
  static getAllIssues(hybridDb: ReturnType<typeof useHybridDb>): LocalIssue[] {
    return hybridDb.getAllIssues();
  }

  // Get issue by ID
  static getIssueById(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string
  ): LocalIssue | undefined {
    return hybridDb.getIssueById(issueId);
  }

  // Get comments for issue
  static getCommentsForIssue(
    hybridDb: ReturnType<typeof useHybridDb>,
    issueId: string
  ): LocalComment[] {
    return hybridDb.getCommentsForIssue(issueId);
  }

  // Sync operations
  static async syncWithTurso(hybridDb: ReturnType<typeof useHybridDb>): Promise<void> {
    await hybridDb.syncWithTurso();
  }

  static async syncWithInstant(hybridDb: ReturnType<typeof useHybridDb>): Promise<void> {
    await hybridDb.syncWithInstant();
  }

  // Enable/disable auto-sync
  static toggleAutoSync(
    hybridDb: ReturnType<typeof useHybridDb>,
    enabled: boolean
  ): void {
    hybridDb.toggleAutoSync(enabled);
  }

  // Utility functions for working with the data
  static getIssuesByStatus(
    hybridDb: ReturnType<typeof useHybridDb>,
    status: string
  ): LocalIssue[] {
    return hybridDb.getAllIssues().filter(issue => issue.status === status);
  }

  static getIssuesByAssignee(
    hybridDb: ReturnType<typeof useHybridDb>,
    assigneeId: string
  ): LocalIssue[] {
    return hybridDb.getAllIssues().filter(issue => issue.assigneeId === assigneeId);
  }

  static getIssuesByPriority(
    hybridDb: ReturnType<typeof useHybridDb>,
    priority: number
  ): LocalIssue[] {
    return hybridDb.getAllIssues().filter(issue => issue.priority === priority);
  }

  // Search issues by title or description
  static searchIssues(
    hybridDb: ReturnType<typeof useHybridDb>,
    query: string
  ): LocalIssue[] {
    const lowerQuery = query.toLowerCase();
    return hybridDb.getAllIssues().filter(issue => 
      issue.title.toLowerCase().includes(lowerQuery) ||
      (issue.description && issue.description.toLowerCase().includes(lowerQuery)) ||
      issue.identifier.toLowerCase().includes(lowerQuery)
    );
  }

  // Get sync statistics
  static getSyncStats(hybridDb: ReturnType<typeof useHybridDb>) {
    const allIssues = hybridDb.localIssues;
    const allComments = hybridDb.localComments;
    
    return {
      totalIssues: allIssues.length,
      totalComments: allComments.length,
      unsyncedIssues: allIssues.filter(issue => !issue.syncedToInstant).length,
      unsyncedComments: allComments.filter(comment => !comment.syncedToInstant).length,
      isSyncing: hybridDb.isSyncing,
      isAutoSyncEnabled: hybridDb.isAutoSyncEnabled,
    };
  }
}

// Utility functions (reused from original dataService)
export const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRelativeTime = (date: string | Date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date);
};
