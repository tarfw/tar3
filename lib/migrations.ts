import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 2;

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
  if (currentDbVersion === 0) {
    await applyInitialMigration(db);
    currentDbVersion = 1;
  }

  // Future migrations can be added here
  if (currentDbVersion === 1) {
    await applyItemsMigration(db);
    currentDbVersion = 2;
  }

  // Set the database version after migrations
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function applyInitialMigration(db: SQLiteDatabase) {
  // Create issues table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      identifier TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'todo',
      statusColor TEXT NOT NULL DEFAULT '#94A3B8',
      assigneeId TEXT,
      creatorId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      dueDate TEXT,
      syncedToInstant BOOLEAN NOT NULL DEFAULT 0
    );
  `);

  // Create comments table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY NOT NULL,
      body TEXT NOT NULL,
      issueId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedToInstant BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (issueId) REFERENCES issues (id) ON DELETE CASCADE
    );
  `);

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
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
    CREATE INDEX IF NOT EXISTS idx_issues_assignee ON issues(assigneeId);
    CREATE INDEX IF NOT EXISTS idx_issues_creator ON issues(creatorId);
    CREATE INDEX IF NOT EXISTS idx_issues_updated ON issues(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_issues_sync ON issues(syncedToInstant);
    CREATE INDEX IF NOT EXISTS idx_comments_issue ON comments(issueId);
    CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(authorId);
    CREATE INDEX IF NOT EXISTS idx_comments_sync ON comments(syncedToInstant);
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
