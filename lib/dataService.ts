import { db, id } from './instant';

export class DataService {
  // Create a new issue with simplified schema
  static async createIssue(data: {
    title: string;
    description?: string;
    creatorId: string;
    assigneeId?: string;
    priority?: number;
    status?: string;
    statusColor?: string;
    dueDate?: string;
  }) {
    const issueId = id(); // Use InstantDB's id() function
    const now = new Date().toISOString();

    // Generate simple identifier
    const issueNumber = Math.floor(Date.now() / 1000) % 10000;
    const identifier = `ISS-${issueNumber}`;

    const issue = {
      id: issueId,
      title: data.title,
      description: data.description || '',
      identifier,
      priority: data.priority || 3, // Medium priority by default
      status: data.status || 'todo',
      statusColor: data.statusColor || '#94A3B8',
      assigneeId: data.assigneeId,
      creatorId: data.creatorId,
      createdAt: now,
      updatedAt: now,
      dueDate: data.dueDate,
    };

    await db.transact(db.tx.issues[issueId].update(issue));
    return issue;
  }

  // Create a comment on an issue
  static async createComment(data: {
    body: string;
    issueId: string;
    authorId: string;
  }) {
    const commentId = id(); // Use InstantDB's id() function
    const now = new Date().toISOString();

    const comment = {
      id: commentId,
      body: data.body,
      issueId: data.issueId,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
    };

    await db.transact(db.tx.comments[commentId].update(comment));
    return comment;
  }

  // Update issue status (simplified - just update the status field)
  static async updateIssueStatus(issueId: string, status: string, statusColor?: string) {
    const now = new Date().toISOString();
    
    await db.transact(
      db.tx.issues[issueId].update({
        status,
        statusColor: statusColor || '#94A3B8',
        updatedAt: now,
      })
    );
  }

  // Update issue priority
  static async updateIssuePriority(issueId: string, priority: number) {
    const now = new Date().toISOString();
    
    await db.transact(
      db.tx.issues[issueId].update({
        priority,
        updatedAt: now,
      })
    );
  }

  // Assign issue to user
  static async assignIssue(issueId: string, assigneeId: string | null) {
    const now = new Date().toISOString();
    
    await db.transact(
      db.tx.issues[issueId].update({
        assigneeId,
        updatedAt: now,
      })
    );
  }
}

// Export utility functions
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
