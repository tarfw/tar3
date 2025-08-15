import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DataService } from '../lib/dataService';
import { Comment, Issue } from '../lib/instant';

// Turso DB Configuration
export const TURSO_DB_NAME = 'tar.db';

export const tursoOptions = {
  url: "libsql://tar5-thamizhtar.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTUyODY0MjAsImlkIjoiMGE1ZmZjNWYtYmE2My00Y2EwLTgwYmEtZmUwNTJhNDUzYzdkIiwicmlkIjoiNjcwMzFlNjgtYjc0NS00ODRjLTkwMjMtZTdlZGYwMWMyZGZjIn0.8t0cG6L8QtXoGGzBkrbGM5Szur1d2tAY0aXVD6b14r9dxOeGZOszttP7QckxSsUjAALhGrjVX9xKfsTCEIXOCw",
};

// Local SQLite issue structure (for Turso local-first)
export interface LocalIssue {
  id: string;
  title: string;
  description: string | null;
  identifier: string;
  priority: number;
  status: string;
  statusColor: string;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  syncedToInstant: boolean; // Flag to track if synced to Instant DB
}

export interface LocalComment {
  id: string;
  body: string;
  issueId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  syncedToInstant: boolean;
}

export interface LocalNote {
  id: number;
  title: string | null;
  content: string | null;
}

interface HybridDbContextType {
  // Issues
  localIssues: LocalIssue[];
  instantIssues: Issue[];
  
  // Comments  
  localComments: LocalComment[];
  instantComments: Comment[];
  
  // Notes
  localNotes: LocalNote[];
  
  // Operations
  createIssue: (data: Omit<LocalIssue, 'id' | 'createdAt' | 'updatedAt' | 'syncedToInstant'>) => Promise<LocalIssue | undefined>;
  updateIssue: (id: string, updates: Partial<LocalIssue>) => Promise<void>;
  deleteIssue: (id: string) => Promise<void>;
  
  createComment: (data: Omit<LocalComment, 'id' | 'createdAt' | 'updatedAt' | 'syncedToInstant'>) => Promise<LocalComment | undefined>;
  updateComment: (id: string, updates: Partial<LocalComment>) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  
  // Notes operations
  createNote: () => Promise<LocalNote | undefined>;
  updateNote: (id: number, updates: Partial<LocalNote>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  
  // Sync operations
  syncWithTurso: () => Promise<void>;
  syncWithInstant: () => Promise<void>;
  toggleAutoSync: (enabled: boolean) => void;
  isSyncing: boolean;
  isAutoSyncEnabled: boolean;
  
  // Combined data getters
  getAllIssues: () => LocalIssue[]; // Prioritizes local data
  getIssueById: (id: string) => LocalIssue | undefined;
  getCommentsForIssue: (issueId: string) => LocalComment[];
  getAllNotes: () => LocalNote[];
  getNoteById: (id: number) => LocalNote | undefined;
}

const HybridDbContext = createContext<HybridDbContextType | null>(null);

interface HybridDbProviderProps {
  children: ReactNode;
  enableTurso?: boolean; // Allow disabling Turso if not configured
}

export function HybridDbProvider({ children, enableTurso = true }: HybridDbProviderProps) {
  // SQLite context (only if Turso is enabled and configured)
  const sqliteDb = enableTurso && tursoOptions.url && tursoOptions.authToken ? useSQLiteContext() : null;
  
  // Local state
  const [localIssues, setLocalIssues] = useState<LocalIssue[]>([]);
  const [localComments, setLocalComments] = useState<LocalComment[]>([]);
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  const [instantIssues, setInstantIssues] = useState<Issue[]>([]);
  const [instantComments, setInstantComments] = useState<Comment[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  
  // Sync interval ref
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  // Initialize and fetch data
  useEffect(() => {
    if (sqliteDb) {
      fetchLocalData();
    }
  }, [sqliteDb]);

  // Auto-sync interval management
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Fetch local data from SQLite/Turso
  const fetchLocalData = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const issues = await sqliteDb.getAllAsync<LocalIssue>(
        'SELECT * FROM issues ORDER BY updatedAt DESC'
      );
      setLocalIssues(issues);

      const comments = await sqliteDb.getAllAsync<LocalComment>(
        'SELECT * FROM comments ORDER BY createdAt ASC'
      );
      setLocalComments(comments);

      const notes = await sqliteDb.getAllAsync<LocalNote>(
        'SELECT * FROM notes ORDER BY id DESC'
      );
      setLocalNotes(notes);
    } catch (error) {
      console.error('Error fetching local data:', error);
    }
  }, [sqliteDb]);

  // Sync with Turso cloud
  const syncWithTurso = useCallback(async () => {
    if (!sqliteDb) return;
    
    console.log('Syncing with Turso...');
    setIsSyncing(true);
    
    try {
      await sqliteDb.syncLibSQL();
      await fetchLocalData();
      console.log('Successfully synced with Turso');
    } catch (error) {
      console.error('Error syncing with Turso:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [sqliteDb, fetchLocalData]);

  // Sync with Instant DB (for realtime features)
  const syncWithInstant = useCallback(async () => {
    if (!sqliteDb) return;
    
    console.log('Syncing unsynced items to Instant DB...');
    
    try {
      // Sync unsynced issues to Instant DB
      const unsyncedIssues = localIssues.filter(issue => !issue.syncedToInstant);
      for (const issue of unsyncedIssues) {
        await DataService.createIssue({
          title: issue.title,
          description: issue.description || undefined,
          creatorId: issue.creatorId,
          assigneeId: issue.assigneeId || undefined,
          priority: issue.priority,
          status: issue.status,
          statusColor: issue.statusColor,
          dueDate: issue.dueDate || undefined,
        });
        
        // Mark as synced in local DB
        await sqliteDb.runAsync(
          'UPDATE issues SET syncedToInstant = 1 WHERE id = ?',
          issue.id
        );
      }
      
      // Sync unsynced comments to Instant DB
      const unsyncedComments = localComments.filter(comment => !comment.syncedToInstant);
      for (const comment of unsyncedComments) {
        await DataService.createComment({
          body: comment.body,
          issueId: comment.issueId,
          authorId: comment.authorId,
        });
        
        // Mark as synced in local DB
        await sqliteDb.runAsync(
          'UPDATE comments SET syncedToInstant = 1 WHERE id = ?',
          comment.id
        );
      }
      
      await fetchLocalData();
      console.log('Successfully synced to Instant DB');
    } catch (error) {
      console.error('Error syncing to Instant DB:', error);
    }
  }, [sqliteDb, localIssues, localComments, fetchLocalData]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback((enabled: boolean) => {
    setIsAutoSyncEnabled(enabled);
    
    if (enabled && sqliteDb) {
      console.log('Starting auto-sync...');
      // Sync immediately when enabled
      syncWithTurso();
      // Set up interval for regular syncing
      syncIntervalRef.current = setInterval(() => {
        syncWithTurso();
        syncWithInstant();
      }, 30000); // Sync every 30 seconds
    } else if (syncIntervalRef.current) {
      console.log('Stopping auto-sync...');
      clearInterval(syncIntervalRef.current);
    }
  }, [sqliteDb, syncWithTurso, syncWithInstant]);

  // Create issue (local-first)
  const createIssue = useCallback(async (data: Omit<LocalIssue, 'id' | 'createdAt' | 'updatedAt' | 'syncedToInstant'>): Promise<LocalIssue | undefined> => {
    if (!sqliteDb) return;
    
    const now = new Date().toISOString();
    const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newIssue: LocalIssue = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      syncedToInstant: false,
    };
    
    try {
      await sqliteDb.runAsync(
        `INSERT INTO issues (id, title, description, identifier, priority, status, statusColor, assigneeId, creatorId, createdAt, updatedAt, dueDate, syncedToInstant) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newIssue.id,
        newIssue.title,
        newIssue.description,
        newIssue.identifier,
        newIssue.priority,
        newIssue.status,
        newIssue.statusColor,
        newIssue.assigneeId,
        newIssue.creatorId,
        newIssue.createdAt,
        newIssue.updatedAt,
        newIssue.dueDate,
        newIssue.syncedToInstant ? 1 : 0
      );
      
      await fetchLocalData();
      return newIssue;
    } catch (error) {
      console.error('Error creating issue:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Update issue
  const updateIssue = useCallback(async (id: string, updates: Partial<LocalIssue>) => {
    if (!sqliteDb) return;
    
    const now = new Date().toISOString();
    const updatedData = { ...updates, updatedAt: now, syncedToInstant: false };
    
    try {
      // Build dynamic update query
      const fields = Object.keys(updatedData).filter(key => updatedData[key as keyof typeof updatedData] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        const value = updatedData[field as keyof typeof updatedData];
        return field === 'syncedToInstant' ? (value ? 1 : 0) : value;
      });
      
      await sqliteDb.runAsync(
        `UPDATE issues SET ${setClause} WHERE id = ?`,
        ...values,
        id
      );
      
      await fetchLocalData();
    } catch (error) {
      console.error('Error updating issue:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Delete issue
  const deleteIssue = useCallback(async (id: string) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM issues WHERE id = ?', id);
      await sqliteDb.runAsync('DELETE FROM comments WHERE issueId = ?', id);
      await fetchLocalData();
    } catch (error) {
      console.error('Error deleting issue:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Create comment
  const createComment = useCallback(async (data: Omit<LocalComment, 'id' | 'createdAt' | 'updatedAt' | 'syncedToInstant'>): Promise<LocalComment | undefined> => {
    if (!sqliteDb) return;
    
    const now = new Date().toISOString();
    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newComment: LocalComment = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      syncedToInstant: false,
    };
    
    try {
      await sqliteDb.runAsync(
        'INSERT INTO comments (id, body, issueId, authorId, createdAt, updatedAt, syncedToInstant) VALUES (?, ?, ?, ?, ?, ?, ?)',
        newComment.id,
        newComment.body,
        newComment.issueId,
        newComment.authorId,
        newComment.createdAt,
        newComment.updatedAt,
        newComment.syncedToInstant ? 1 : 0
      );
      
      await fetchLocalData();
      return newComment;
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Update comment
  const updateComment = useCallback(async (id: string, updates: Partial<LocalComment>) => {
    if (!sqliteDb) return;
    
    const now = new Date().toISOString();
    const updatedData = { ...updates, updatedAt: now, syncedToInstant: false };
    
    try {
      const fields = Object.keys(updatedData).filter(key => updatedData[key as keyof typeof updatedData] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => {
        const value = updatedData[field as keyof typeof updatedData];
        return field === 'syncedToInstant' ? (value ? 1 : 0) : value;
      });
      
      await sqliteDb.runAsync(
        `UPDATE comments SET ${setClause} WHERE id = ?`,
        ...values,
        id
      );
      
      await fetchLocalData();
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Delete comment
  const deleteComment = useCallback(async (id: string) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM comments WHERE id = ?', id);
      await fetchLocalData();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Combined data getters (prioritize local data)
  const getAllIssues = useCallback(() => {
    return localIssues; // Always prioritize local data for offline-first approach
  }, [localIssues]);

  const getIssueById = useCallback((id: string) => {
    return localIssues.find(issue => issue.id === id);
  }, [localIssues]);

  const getCommentsForIssue = useCallback((issueId: string) => {
    return localComments.filter(comment => comment.issueId === issueId);
  }, [localComments]);

  // Notes operations
  const createNote = useCallback(async (): Promise<LocalNote | undefined> => {
    if (!sqliteDb) return;
    
    const newNote: LocalNote = {
      id: 0, // Will be auto-generated
      title: '',
      content: '',
    };
    
    try {
      const result = await sqliteDb.runAsync(
        'INSERT INTO notes (title, content) VALUES (?, ?)',
        newNote.title,
        newNote.content
      );
      
      await fetchLocalData();
      
      // Return the created note with the actual ID
      return {
        ...newNote,
        id: result.lastInsertRowId as number,
      };
    } catch (error) {
      console.error('Error creating note:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  const updateNote = useCallback(async (id: number, updates: Partial<LocalNote>) => {
    if (!sqliteDb) return;
    
    try {
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);
      
      await sqliteDb.runAsync(
        `UPDATE notes SET ${setClause} WHERE id = ?`,
        ...values,
        id
      );
      
      await fetchLocalData();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  const deleteNote = useCallback(async (id: number) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM notes WHERE id = ?', id);
      await fetchLocalData();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }, [sqliteDb, fetchLocalData]);

  // Notes data getters
  const getAllNotes = useCallback(() => {
    return localNotes;
  }, [localNotes]);

  const getNoteById = useCallback((id: number) => {
    return localNotes.find(note => note.id === id);
  }, [localNotes]);

  const contextValue: HybridDbContextType = {
    localIssues,
    instantIssues,
    localComments,
    instantComments,
    localNotes,
    createIssue,
    updateIssue,
    deleteIssue,
    createComment,
    updateComment,
    deleteComment,
    createNote,
    updateNote,
    deleteNote,
    syncWithTurso,
    syncWithInstant,
    toggleAutoSync,
    isSyncing,
    isAutoSyncEnabled,
    getAllIssues,
    getIssueById,
    getCommentsForIssue,
    getAllNotes,
    getNoteById,
  };

  return (
    <HybridDbContext.Provider value={contextValue}>
      {children}
    </HybridDbContext.Provider>
  );
}

export function useHybridDb() {
  const context = useContext(HybridDbContext);
  if (!context) {
    throw new Error('useHybridDb must be used within a HybridDbProvider');
  }
  return context;
}
