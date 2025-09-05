
import { SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useTurso } from './TursoContext';
import { TursoHttpService } from '@/lib/tursoHttpService';

// Turso DB Configuration
const TURSO_DB_NAME = 'tar.db';

// Local SQLite interfaces (simplified)
export interface LocalNote {
  id: number;
  title: string | null;
  content: string | null;
}

// Items interfaces (based on the schema)
export interface LocalItem {
  id: number;
  name: string;
  category: string | null;
  optionIds: string; // JSON string of number array
}

export interface LocalVariant {
  id: number;
  itemId: number;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock: number;
  status: number; // 0 = Inactive, 1 = Active, 2 = Archived
  optionIds: string; // JSON string of number array
}

export interface LocalOpGroup {
  id: number;
  name: string;
}

export interface LocalOpValue {
  id: number;
  groupId: number;
  value: string;
}

// Cloud data interfaces (for direct Turso access)
export interface CloudItem extends LocalItem {}
export interface CloudVariant extends LocalVariant {}
export interface CloudOpGroup extends LocalOpGroup {}
export interface CloudOpValue extends LocalOpValue {}

interface HybridDbContextType {
  // Notes (selective sync - can be local or cloud)
  localNotes: LocalNote[];
  
  // Items (local-only by default, cloud access when needed)
  localItems: LocalItem[];
  localVariants: LocalVariant[];
  localOpGroups: LocalOpGroup[];
  localOpValues: LocalOpValue[];
  
  // Cloud access methods (for all tables)
  getCloudItems: () => Promise<CloudItem[]>;
  getCloudVariants: () => Promise<CloudVariant[]>;
  getCloudOpGroups: () => Promise<CloudOpGroup[]>;
  getCloudOpValues: () => Promise<CloudOpValue[]>;
  
  // Cloud mutation methods
  createCloudItem: (item: Omit<CloudItem, 'id'>) => Promise<CloudItem | null>;
  updateCloudItem: (id: number, updates: Partial<CloudItem>) => Promise<boolean>;
  deleteCloudItem: (id: number) => Promise<boolean>;
  
  // Notes operations (local)
  createNote: () => Promise<LocalNote | undefined>;
  updateNote: (id: number, updates: Partial<LocalNote>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  
  // Local items operations (no sync by default)
  createLocalItem: (item: Omit<LocalItem, 'id'>) => Promise<LocalItem | undefined>;
  updateLocalItem: (id: number, updates: Partial<LocalItem>) => Promise<void>;
  deleteLocalItem: (id: number) => Promise<void>;
  
  // Local variants operations
  createLocalVariant: (variant: Omit<LocalVariant, 'id'>) => Promise<LocalVariant | undefined>;
  updateLocalVariant: (id: number, updates: Partial<LocalVariant>) => Promise<void>;
  deleteLocalVariant: (id: number) => Promise<void>;
  
  // Local option groups operations
  createLocalOpGroup: (group: Omit<LocalOpGroup, 'id'>) => Promise<LocalOpGroup | undefined>;
  
  // Local option values operations
  createLocalOpValue: (value: Omit<LocalOpValue, 'id'>) => Promise<LocalOpValue | undefined>;
  
  // Data getters (local)
  getAllNotes: () => LocalNote[];
  getNoteById: (id: number) => LocalNote | undefined;
  
  // Local data getters
  getAllLocalItems: () => LocalItem[];
  getLocalItem: (id: number) => LocalItem | undefined;
  getLocalVariantsByItemId: (itemId: number) => LocalVariant[];
  getAllLocalOpGroups: () => LocalOpGroup[];
  getLocalOpValuesByGroupId: (groupId: number) => LocalOpValue[];
  getAllLocalOpValues: () => LocalOpValue[];
  
  // Refresh methods to update local data from cloud when needed
  refreshLocalItems: () => Promise<void>;
  refreshLocalVariants: () => Promise<void>;
  refreshLocalOpGroups: () => Promise<void>;
  refreshLocalOpValues: () => Promise<void>;
}

const HybridDbContext = createContext<HybridDbContextType | null>(null);

interface HybridDbProviderProps {
  children: ReactNode;
  enableTurso?: boolean;
  tursoUrl?: string;
  tursoAuthToken?: string;
}

export function HybridDbProvider({ 
  children, 
  enableTurso = true,
  tursoUrl,
  tursoAuthToken
}: HybridDbProviderProps) {
  // Use Turso context to get configuration status
  const { isTursoConfigured: contextTursoConfigured, tursoUrl: contextTursoUrl, tursoAuthToken: contextTursoAuthToken } = useTurso();
  
  // Determine actual Turso configuration
  const isTursoConfigured = enableTurso && (contextTursoConfigured || (tursoUrl && tursoAuthToken));
  const actualTursoUrl = tursoUrl || contextTursoUrl;
  const actualTursoAuthToken = tursoAuthToken || contextTursoAuthToken;
  
  // SQLite context (only if Turso is enabled and configured)
  const sqliteDb = isTursoConfigured ? useSQLiteContext() : null;
  
  // Local state
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [localVariants, setLocalVariants] = useState<LocalVariant[]>([]);
  const [localOpGroups, setLocalOpGroups] = useState<LocalOpGroup[]>([]);
  const [localOpValues, setLocalOpValues] = useState<LocalOpValue[]>([]);
  
  // Initialize and fetch data
  useEffect(() => {
    if (sqliteDb) {
      fetchLocalData();
    }
  }, [sqliteDb]);

  // Fetch local data from SQLite
  const fetchLocalData = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const notes = await sqliteDb.getAllAsync<LocalNote>(
        'SELECT * FROM notes ORDER BY id DESC'
      );
      setLocalNotes(notes);

      // Fetch items data
      const items = await sqliteDb.getAllAsync<LocalItem>(
        'SELECT * FROM items ORDER BY id DESC'
      );
      setLocalItems(items);

      const variants = await sqliteDb.getAllAsync<LocalVariant>(
        'SELECT * FROM variants ORDER BY id DESC'
      );
      setLocalVariants(variants);

      const opGroups = await sqliteDb.getAllAsync<LocalOpGroup>(
        'SELECT * FROM opgroups ORDER BY id ASC'
      );
      setLocalOpGroups(opGroups);

      const opValues = await sqliteDb.getAllAsync<LocalOpValue>(
        'SELECT * FROM opvalues ORDER BY groupId ASC, id ASC'
      );
      setLocalOpValues(opValues);
    } catch (error) {
      console.error('Error fetching local data:', error);
    }
  }, [sqliteDb]);

  // Cloud access methods
  const getCloudItems = useCallback(async (): Promise<CloudItem[]> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return [];
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery("SELECT * FROM items ORDER BY id DESC");
      return result.results && result.results.length > 0 ? result.results[0] as CloudItem[] : [];
    } catch (error) {
      console.error('Error fetching cloud items:', error);
      return [];
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  const getCloudVariants = useCallback(async (): Promise<CloudVariant[]> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return [];
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery("SELECT * FROM variants ORDER BY id DESC");
      return result.results && result.results.length > 0 ? result.results[0] as CloudVariant[] : [];
    } catch (error) {
      console.error('Error fetching cloud variants:', error);
      return [];
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  const getCloudOpGroups = useCallback(async (): Promise<CloudOpGroup[]> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return [];
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery("SELECT * FROM opgroups ORDER BY id ASC");
      return result.results && result.results.length > 0 ? result.results[0] as CloudOpGroup[] : [];
    } catch (error) {
      console.error('Error fetching cloud option groups:', error);
      return [];
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  const getCloudOpValues = useCallback(async (): Promise<CloudOpValue[]> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return [];
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery("SELECT * FROM opvalues ORDER BY groupId ASC, id ASC");
      return result.results && result.results.length > 0 ? result.results[0] as CloudOpValue[] : [];
    } catch (error) {
      console.error('Error fetching cloud option values:', error);
      return [];
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  // Cloud mutation methods
  const createCloudItem = useCallback(async (itemData: Omit<CloudItem, 'id'>): Promise<CloudItem | null> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return null;
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery({
        sql: "INSERT INTO items (name, category, optionIds) VALUES (?, ?, ?) RETURNING *",
        args: [itemData.name, itemData.category, itemData.optionIds]
      });
      
      if (result.results && result.results.length > 0 && result.results[0].length > 0) {
        return result.results[0][0] as CloudItem;
      }
      return null;
    } catch (error) {
      console.error('Error creating cloud item:', error);
      return null;
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  const updateCloudItem = useCallback(async (id: number, updates: Partial<CloudItem>): Promise<boolean> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return false;
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);
      
      if (fields.length === 0) return true;
      
      const result = await service.executeQuery({
        sql: `UPDATE items SET ${setClause} WHERE id = ?`,
        args: [...values, id]
      });
      
      return result.results && result.results.length > 0 ? result.results[0].rowsAffected > 0 : false;
    } catch (error) {
      console.error('Error updating cloud item:', error);
      return false;
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  const deleteCloudItem = useCallback(async (id: number): Promise<boolean> => {
    if (!isTursoConfigured || !actualTursoUrl || !actualTursoAuthToken) {
      return false;
    }
    
    try {
      const service = new TursoHttpService(actualTursoUrl, actualTursoAuthToken);
      
      const result = await service.executeQuery({
        sql: "DELETE FROM items WHERE id = ?",
        args: [id]
      });
      
      return result.results && result.results.length > 0 ? result.results[0].rowsAffected > 0 : false;
    } catch (error) {
      console.error('Error deleting cloud item:', error);
      return false;
    }
  }, [isTursoConfigured, actualTursoUrl, actualTursoAuthToken]);

  // Notes operations (local)
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

  // Local items operations (no sync by default)
  const createLocalItem = useCallback(async (itemData: Omit<LocalItem, 'id'>): Promise<LocalItem | undefined> => {
    if (!sqliteDb) return;
    
    try {
      const result = await sqliteDb.runAsync(
        'INSERT INTO items (name, category, optionIds) VALUES (?, ?, ?)',
        itemData.name,
        itemData.category,
        itemData.optionIds
      );
      
      const newItem: LocalItem = {
        ...itemData,
        id: result.lastInsertRowId as number,
      };
      
      // Update only the items state instead of fetching all data
      setLocalItems(prev => [newItem, ...prev]);
      
      return newItem;
    } catch (error) {
      console.error('Error creating local item:', error);
    }
  }, [sqliteDb]);

  const updateLocalItem = useCallback(async (id: number, updates: Partial<LocalItem>) => {
    if (!sqliteDb) return;
    
    try {
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);
      
      await sqliteDb.runAsync(
        `UPDATE items SET ${setClause} WHERE id = ?`,
        ...values,
        id
      );
      
      // Update only the items state instead of fetching all data
      setLocalItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error) {
      console.error('Error updating local item:', error);
    }
  }, [sqliteDb]);

  const deleteLocalItem = useCallback(async (id: number) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM items WHERE id = ?', id);
      await sqliteDb.runAsync('DELETE FROM variants WHERE itemId = ?', id);
      
      // Update both items and variants state instead of fetching all data
      setLocalItems(prev => prev.filter(item => item.id !== id));
      setLocalVariants(prev => prev.filter(variant => variant.itemId !== id));
    } catch (error) {
      console.error('Error deleting local item:', error);
    }
  }, [sqliteDb]);

  // Local variants operations
  const createLocalVariant = useCallback(async (variantData: Omit<LocalVariant, 'id'>): Promise<LocalVariant | undefined> => {
    if (!sqliteDb) return;
    
    try {
      const result = await sqliteDb.runAsync(
        'INSERT INTO variants (itemId, sku, barcode, price, stock, status, optionIds) VALUES (?, ?, ?, ?, ?, ?, ?)',
        variantData.itemId,
        variantData.sku,
        variantData.barcode,
        variantData.price,
        variantData.stock,
        variantData.status,
        variantData.optionIds
      );
      
      const newVariant: LocalVariant = {
        ...variantData,
        id: result.lastInsertRowId as number,
      };
      
      // Update only the variants state instead of fetching all data
      setLocalVariants(prev => [newVariant, ...prev]);
      
      return newVariant;
    } catch (error) {
      console.error('Error creating local variant:', error);
    }
  }, [sqliteDb]);

  const updateLocalVariant = useCallback(async (id: number, updates: Partial<LocalVariant>) => {
    if (!sqliteDb) return;
    
    try {
      const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updates[field as keyof typeof updates]);
      
      await sqliteDb.runAsync(
        `UPDATE variants SET ${setClause} WHERE id = ?`,
        ...values,
        id
      );
      
      // Update only the variants state instead of fetching all data
      setLocalVariants(prev => prev.map(variant => 
        variant.id === id ? { ...variant, ...updates } : variant
      ));
    } catch (error) {
      console.error('Error updating local variant:', error);
    }
  }, [sqliteDb]);

  const deleteLocalVariant = useCallback(async (id: number) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM variants WHERE id = ?', id);
      
      // Update only the variants state instead of fetching all data
      setLocalVariants(prev => prev.filter(variant => variant.id !== id));
    } catch (error) {
      console.error('Error deleting local variant:', error);
    }
  }, [sqliteDb]);

  // Local option groups operations
  const createLocalOpGroup = useCallback(async (groupData: Omit<LocalOpGroup, 'id'>): Promise<LocalOpGroup | undefined> => {
    if (!sqliteDb) return;
    
    try {
      const result = await sqliteDb.runAsync(
        'INSERT INTO opgroups (name) VALUES (?)',
        groupData.name
      );
      
      const newGroup: LocalOpGroup = {
        ...groupData,
        id: result.lastInsertRowId as number,
      };
      
      // Update only the opgroups state instead of fetching all data
      setLocalOpGroups(prev => [...prev, newGroup]);
      
      return newGroup;
    } catch (error) {
      console.error('Error creating local option group:', error);
    }
  }, [sqliteDb]);

  // Local option values operations
  const createLocalOpValue = useCallback(async (valueData: Omit<LocalOpValue, 'id'>): Promise<LocalOpValue | undefined> => {
    if (!sqliteDb) return;
    
    try {
      const result = await sqliteDb.runAsync(
        'INSERT INTO opvalues (groupId, value) VALUES (?, ?)',
        valueData.groupId,
        valueData.value
      );
      
      const newValue: LocalOpValue = {
        ...valueData,
        id: result.lastInsertRowId as number,
      };
      
      // Update only the opvalues state instead of fetching all data
      setLocalOpValues(prev => [...prev, newValue]);
      
      return newValue;
    } catch (error) {
      console.error('Error creating local option value:', error);
    }
  }, [sqliteDb]);

  // Refresh methods to update local data from cloud when needed
  const refreshLocalItems = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const cloudItems = await getCloudItems();
      
      // Clear local items
      await sqliteDb.runAsync('DELETE FROM items');
      
      // Insert cloud items into local database
      for (const item of cloudItems) {
        await sqliteDb.runAsync(
          'INSERT INTO items (id, name, category, optionIds) VALUES (?, ?, ?, ?)',
          item.id,
          item.name,
          item.category,
          item.optionIds
        );
      }
      
      // Update local state
      setLocalItems(cloudItems);
    } catch (error) {
      console.error('Error refreshing local items:', error);
    }
  }, [sqliteDb, getCloudItems]);

  const refreshLocalVariants = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const cloudVariants = await getCloudVariants();
      
      // Clear local variants
      await sqliteDb.runAsync('DELETE FROM variants');
      
      // Insert cloud variants into local database
      for (const variant of cloudVariants) {
        await sqliteDb.runAsync(
          'INSERT INTO variants (id, itemId, sku, barcode, price, stock, status, optionIds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          variant.id,
          variant.itemId,
          variant.sku,
          variant.barcode,
          variant.price,
          variant.stock,
          variant.status,
          variant.optionIds
        );
      }
      
      // Update local state
      setLocalVariants(cloudVariants);
    } catch (error) {
      console.error('Error refreshing local variants:', error);
    }
  }, [sqliteDb, getCloudVariants]);

  const refreshLocalOpGroups = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const cloudOpGroups = await getCloudOpGroups();
      
      // Clear local opgroups
      await sqliteDb.runAsync('DELETE FROM opgroups');
      
      // Insert cloud opgroups into local database
      for (const group of cloudOpGroups) {
        await sqliteDb.runAsync(
          'INSERT INTO opgroups (id, name) VALUES (?, ?)',
          group.id,
          group.name
        );
      }
      
      // Update local state
      setLocalOpGroups(cloudOpGroups);
    } catch (error) {
      console.error('Error refreshing local option groups:', error);
    }
  }, [sqliteDb, getCloudOpGroups]);

  const refreshLocalOpValues = useCallback(async () => {
    if (!sqliteDb) return;
    
    try {
      const cloudOpValues = await getCloudOpValues();
      
      // Clear local opvalues
      await sqliteDb.runAsync('DELETE FROM opvalues');
      
      // Insert cloud opvalues into local database
      for (const value of cloudOpValues) {
        await sqliteDb.runAsync(
          'INSERT INTO opvalues (id, groupId, value) VALUES (?, ?, ?)',
          value.id,
          value.groupId,
          value.value
        );
      }
      
      // Update local state
      setLocalOpValues(cloudOpValues);
    } catch (error) {
      console.error('Error refreshing local option values:', error);
    }
  }, [sqliteDb, getCloudOpValues]);

  // Data getters (local)
  const getAllNotes = useCallback(() => {
    return localNotes;
  }, [localNotes]);

  const getNoteById = useCallback((id: number) => {
    return localNotes.find(note => note.id === id);
  }, [localNotes]);

  const getAllLocalItems = useCallback(() => {
    return localItems;
  }, [localItems]);

  const getLocalItem = useCallback((id: number) => {
    return localItems.find(item => item.id === id);
  }, [localItems]);

  const getLocalVariantsByItemId = useCallback((itemId: number) => {
    return localVariants.filter(variant => variant.itemId === itemId);
  }, [localVariants]);

  const getAllLocalOpGroups = useCallback(() => {
    return localOpGroups;
  }, [localOpGroups]);

  const getLocalOpValuesByGroupId = useCallback((groupId: number) => {
    return localOpValues.filter(value => value.groupId === groupId);
  }, [localOpValues]);

  const getAllLocalOpValues = useCallback(() => {
    return localOpValues;
  }, [localOpValues]);

  const contextValue: HybridDbContextType = {
    // Local data
    localNotes,
    localItems,
    localVariants,
    localOpGroups,
    localOpValues,
    
    // Cloud access methods
    getCloudItems,
    getCloudVariants,
    getCloudOpGroups,
    getCloudOpValues,
    
    // Cloud mutation methods
    createCloudItem,
    updateCloudItem,
    deleteCloudItem,
    
    // Notes operations
    createNote,
    updateNote,
    deleteNote,
    
    // Local items operations
    createLocalItem,
    updateLocalItem,
    deleteLocalItem,
    
    // Local variants operations
    createLocalVariant,
    updateLocalVariant,
    deleteLocalVariant,
    
    // Local option groups operations
    createLocalOpGroup,
    
    // Local option values operations
    createLocalOpValue,
    
    // Data getters
    getAllNotes,
    getNoteById,
    
    // Local data getters
    getAllLocalItems,
    getLocalItem,
    getLocalVariantsByItemId,
    getAllLocalOpGroups,
    getLocalOpValuesByGroupId,
    getAllLocalOpValues,
    
    // Refresh methods
    refreshLocalItems,
    refreshLocalVariants,
    refreshLocalOpGroups,
    refreshLocalOpValues,
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