import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useTurso } from './TursoContext';

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

interface HybridDbContextType {
  // Notes
  localNotes: LocalNote[];
  
  // Items
  localItems: LocalItem[];
  localVariants: LocalVariant[];
  localOpGroups: LocalOpGroup[];
  localOpValues: LocalOpValue[];
  
  // Notes operations
  createNote: () => Promise<LocalNote | undefined>;
  updateNote: (id: number, updates: Partial<LocalNote>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  
  // Items operations
  createItem: (item: Omit<LocalItem, 'id'>) => Promise<LocalItem | undefined>;
  updateItem: (id: number, updates: Partial<LocalItem>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  
  // Variants operations
  createVariant: (variant: Omit<LocalVariant, 'id'>) => Promise<LocalVariant | undefined>;
  updateVariant: (id: number, updates: Partial<LocalVariant>) => Promise<void>;
  deleteVariant: (id: number) => Promise<void>;
  
  // Option Groups operations
  createOpGroup: (group: Omit<LocalOpGroup, 'id'>) => Promise<LocalOpGroup | undefined>;
  
  // Option Values operations
  createOpValue: (value: Omit<LocalOpValue, 'id'>) => Promise<LocalOpValue | undefined>;
  
  // Data getters
  getAllNotes: () => LocalNote[];
  getNoteById: (id: number) => LocalNote | undefined;
  
  // Items data getters
  getAllItems: () => LocalItem[];
  getItem: (id: number) => LocalItem | undefined;
  getVariantsByItemId: (itemId: number) => LocalVariant[];
  getAllOpGroups: () => LocalOpGroup[];
  getOpValuesByGroupId: (groupId: number) => LocalOpValue[];
  getAllOpValues: () => LocalOpValue[];
}

const HybridDbContext = createContext<HybridDbContextType | null>(null);

interface HybridDbProviderProps {
  children: ReactNode;
  enableTurso?: boolean; // Allow disabling Turso if not configured
}

export function HybridDbProvider({ children, enableTurso = true }: HybridDbProviderProps) {
  // Use Turso context to get configuration status
  const { isTursoConfigured } = useTurso();
  
  // SQLite context (only if Turso is enabled and configured)
  const sqliteDb = enableTurso && isTursoConfigured ? useSQLiteContext() : null;
  
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

  // Fetch local data from SQLite/Turso
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

  // Items operations
  const createItem = useCallback(async (itemData: Omit<LocalItem, 'id'>): Promise<LocalItem | undefined> => {
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
      console.error('Error creating item:', error);
    }
  }, [sqliteDb]);

  const updateItem = useCallback(async (id: number, updates: Partial<LocalItem>) => {
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
      console.error('Error updating item:', error);
    }
  }, [sqliteDb]);

  const deleteItem = useCallback(async (id: number) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM items WHERE id = ?', id);
      await sqliteDb.runAsync('DELETE FROM variants WHERE itemId = ?', id);
      
      // Update both items and variants state instead of fetching all data
      setLocalItems(prev => prev.filter(item => item.id !== id));
      setLocalVariants(prev => prev.filter(variant => variant.itemId !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [sqliteDb]);

  // Variants operations
  const createVariant = useCallback(async (variantData: Omit<LocalVariant, 'id'>): Promise<LocalVariant | undefined> => {
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
      console.error('Error creating variant:', error);
    }
  }, [sqliteDb]);

  const updateVariant = useCallback(async (id: number, updates: Partial<LocalVariant>) => {
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
      console.error('Error updating variant:', error);
    }
  }, [sqliteDb]);

  const deleteVariant = useCallback(async (id: number) => {
    if (!sqliteDb) return;
    
    try {
      await sqliteDb.runAsync('DELETE FROM variants WHERE id = ?', id);
      
      // Update only the variants state instead of fetching all data
      setLocalVariants(prev => prev.filter(variant => variant.id !== id));
    } catch (error) {
      console.error('Error deleting variant:', error);
    }
  }, [sqliteDb]);

  // Option Groups operations
  const createOpGroup = useCallback(async (groupData: Omit<LocalOpGroup, 'id'>): Promise<LocalOpGroup | undefined> => {
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
      console.error('Error creating option group:', error);
    }
  }, [sqliteDb]);

  // Option Values operations
  const createOpValue = useCallback(async (valueData: Omit<LocalOpValue, 'id'>): Promise<LocalOpValue | undefined> => {
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
      console.error('Error creating option value:', error);
    }
  }, [sqliteDb]);

  // Data getters
  const getAllNotes = useCallback(() => {
    return localNotes;
  }, [localNotes]);

  const getNoteById = useCallback((id: number) => {
    return localNotes.find(note => note.id === id);
  }, [localNotes]);

  const getAllItems = useCallback(() => {
    return localItems;
  }, [localItems]);

  const getItem = useCallback((id: number) => {
    return localItems.find(item => item.id === id);
  }, [localItems]);

  const getVariantsByItemId = useCallback((itemId: number) => {
    return localVariants.filter(variant => variant.itemId === itemId);
  }, [localVariants]);

  const getAllOpGroups = useCallback(() => {
    return localOpGroups;
  }, [localOpGroups]);

  const getOpValuesByGroupId = useCallback((groupId: number) => {
    return localOpValues.filter(value => value.groupId === groupId);
  }, [localOpValues]);

  const getAllOpValues = useCallback(() => {
    return localOpValues;
  }, [localOpValues]);

  const contextValue: HybridDbContextType = {
    localNotes,
    localItems,
    localVariants,
    localOpGroups,
    localOpValues,
    createNote,
    updateNote,
    deleteNote,
    createItem,
    updateItem,
    deleteItem,
    createVariant,
    updateVariant,
    deleteVariant,
    createOpGroup,
    createOpValue,
    getAllNotes,
    getNoteById,
    getAllItems,
    getItem,
    getVariantsByItemId,
    getAllOpGroups,
    getOpValuesByGroupId,
    getAllOpValues,
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