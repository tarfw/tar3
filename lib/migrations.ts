import { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function runMigrations(db: SQLiteDatabase) {
  try {
    // Always sync libSQL first to prevent conflicts between local and remote databases
    await db.syncLibSQL();
  } catch (e) {
    console.log('Error syncing libSQL during migration:', e);
  }

  // Get current database version
  let result = await db.getFirstAsync<{ user_version: number } | null>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  // If the current version is already equal or newer, no migration is needed
  if (currentDbVersion >= DATABASE_VERSION) {
    console.log('No migration needed, DB version:', currentDbVersion);
    return;
  }

  // Apply migrations based on version
  if (currentDbVersion === 0) {
    await applyInitialMigration(db);
    currentDbVersion = 1;
  }

  // Future migrations can be added here
  // if (currentDbVersion === 1) {
  //   await applyMigrationV2(db);
  //   currentDbVersion = 2;
  // }

  // Set the database version after migrations
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  console.log('Migration completed, DB version:', DATABASE_VERSION);
}

async function applyInitialMigration(db: SQLiteDatabase) {
  console.log('Applying initial migration...');
  
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
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT,
      content TEXT,
      modifiedDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      syncedToTurso BOOLEAN NOT NULL DEFAULT 0
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
    CREATE INDEX IF NOT EXISTS idx_notes_modified ON notes(modifiedDate);
    CREATE INDEX IF NOT EXISTS idx_notes_sync ON notes(syncedToTurso);
  `);

  console.log('Initial migration applied successfully');
}
