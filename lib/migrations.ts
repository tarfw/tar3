import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 3;

export async function runMigrations(db: SQLiteDatabase) {
  // Get current database version first
  let result = await db.getFirstAsync<{ user_version: number } | null>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  // Apply migrations first, then sync
  if (currentDbVersion < DATABASE_VERSION) {
    await applyMigrations(db, currentDbVersion);
  }

  // Now try to sync with remote
  try {
    await db.syncLibSQL();
  } catch (e) {
    console.log('Error syncing libSQL after migration:', e);
  }
}

async function applyMigrations(db: SQLiteDatabase, currentDbVersion: number) {

  // If the current version is already equal or newer, no migration is needed
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  // Apply migrations based on version
  if (currentDbVersion < 1) {
    await applyInitialMigration(db);
  }

  // Items migration (version 1 -> 2)
  if (currentDbVersion < 2) {
    await applyItemsMigration(db);
  }

  // Remove issues/comments migration (version 2 -> 3)
  if (currentDbVersion < 3) {
    await removeIssuesAndCommentsTables(db);
  }

  // Set the database version after migrations
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function removeIssuesAndCommentsTables(db: SQLiteDatabase) {
  // Drop indexes first
  await db.execAsync(`
    DROP INDEX IF EXISTS idx_issues_status;
    DROP INDEX IF EXISTS idx_issues_priority;
    DROP INDEX IF EXISTS idx_issues_assignee;
    DROP INDEX IF EXISTS idx_issues_creator;
    DROP INDEX IF EXISTS idx_issues_updated;
    DROP INDEX IF EXISTS idx_issues_sync;
    DROP INDEX IF EXISTS idx_comments_issue;
    DROP INDEX IF EXISTS idx_comments_author;
    DROP INDEX IF EXISTS idx_comments_sync;
  `);
  
  // Drop tables
  await db.execAsync(`
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS issues;
  `);
}

async function applyInitialMigration(db: SQLiteDatabase) {
  // Create notes table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      content TEXT
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_id ON notes(id);
  `);
}

async function applyItemsMigration(db: SQLiteDatabase) {
  // Create items table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      optionIds TEXT NOT NULL DEFAULT '[]'
    );
  `);

  // Create variants table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      sku TEXT,
      barcode TEXT,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      status INTEGER NOT NULL DEFAULT 1,
      optionIds TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (itemId) REFERENCES items (id) ON DELETE CASCADE
    );
  `);

  // Create opgroups table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS opgroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  // Create opvalues table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS opvalues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupId INTEGER NOT NULL,
      value TEXT NOT NULL,
      FOREIGN KEY (groupId) REFERENCES opgroups (id) ON DELETE CASCADE
    );
  `);

  // Create indexes for better performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_variants_item ON variants(itemId);
    CREATE INDEX IF NOT EXISTS idx_variants_status ON variants(status);
    CREATE INDEX IF NOT EXISTS idx_opvalues_group ON opvalues(groupId);
  `);
}
