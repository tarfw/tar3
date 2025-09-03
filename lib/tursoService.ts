import { db } from './instant';

// Turso API configuration
const TURSO_ORG_NAME = 'tarfw';
const TURSO_API_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJVUFhLRElkVkVmQ2ZPekp2NzV3MDNBIn0.opgKT3SXLbB46rWWWFRVTr09s87ieCRU9Fcq2h8YipBD9B_e1N71AUptvRGzoYcdqqtVnwl3HYq1t_AQsMP1DQ';

// Turso API base URL
const TURSO_API_URL = 'https://api.turso.tech';

interface TursoDatabase {
  id: string;
  name: string;
  hostname: string;
  region: string;
  primaryRegion: string;
  createdAt: string;
  suspended: boolean;
  version: string;
  authToken?: string;
}

export class TursoService {
  private apiToken: string;
  private orgName: string;

  constructor() {
    this.apiToken = TURSO_API_TOKEN;
    this.orgName = TURSO_ORG_NAME;
  }

  // Create a new database for a user
  async createUserDatabase(userId: string, userEmail?: string): Promise<TursoDatabase> {
    try {
      // Generate a database name based on user's email (without symbols) and a short unique identifier
      let dbName = 'user-db';
      if (userEmail) {
        // Remove symbols and use email prefix
        const emailPrefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        // Use email prefix (max 15 chars) and last 4 chars of userId for uniqueness
        const shortUserId = userId.replace(/-/g, '').slice(-4);
        dbName = `${emailPrefix.substring(0, 15)}-${shortUserId}`;
      } else {
        // Fallback to user ID based naming with last 8 chars
        dbName = `user-${userId.replace(/-/g, '').slice(-8)}`;
      }
      
      console.log(`Attempting to create Turso database with name: ${dbName}`);
      
      // Check if database already exists in InstantDB
      const existingDb = await this.getUserDatabaseInfoFromInstantDB(userId);
      if (existingDb) {
        console.log(`Turso database already exists for user ${userId}`);
        return existingDb;
      }
      
      // Create database
      const response = await fetch(`${TURSO_API_URL}/v1/organizations/${this.orgName}/databases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dbName,
          group: 'default'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Turso API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorText: errorText
        });
        
        // Handle case where database already exists
        if (response.status === 409 && errorText.includes('already exists')) {
          console.log(`Database already exists for user ${userId}, retrieving existing info`);
          // Try to get existing database info
          const existingDb = await this.getUserDatabaseInfoFromInstantDB(userId);
          if (existingDb) {
            console.log(`Found existing database info for user ${userId}: ${existingDb.name}`);
            return existingDb;
          }
          
          // If we can't find it in InstantDB, we need to handle this case
          console.warn(`Database exists but no info found in InstantDB for user ${userId}`);
          // Generate the expected database name with the new naming convention
          let dbName = 'user-db';
          if (userEmail) {
            const emailPrefix = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const shortUserId = userId.replace(/-/g, '').slice(-4);
            dbName = `${emailPrefix.substring(0, 15)}-${shortUserId}`;
          } else {
            dbName = `user-${userId.replace(/-/g, '').slice(-8)}`;
          }
          
          // Generate a minimal auth token
          const authToken = await this.getDatabaseAuthToken(dbName);
          
          // Create a minimal database info object
          const database: TursoDatabase = {
            id: '', // Not available without another API call
            name: dbName,
            hostname: `${dbName}-${this.orgName}.turso.io`,
            region: 'default',
            primaryRegion: 'default',
            createdAt: new Date().toISOString(),
            suspended: false,
            version: 'latest',
            authToken: authToken
          };
          
          // Try to save this info to InstantDB
          try {
            await this.saveUserDatabaseInfoToInstantDB(userId, database);
            console.log(`Saved minimal database info for user ${userId}`);
          } catch (saveError) {
            console.warn(`Failed to save minimal database info for user ${userId}:`, saveError);
          }
          
          return database;
        }
        
        throw new Error(`Failed to create Turso database: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Turso API Response:', JSON.stringify(result, null, 2));
      
      // Turso API returns database info with different casing
      const database: TursoDatabase = {
        id: result.database.DbId,
        name: result.database.Name,
        hostname: result.database.Hostname,
        region: 'default', // Will be generated when needed
        primaryRegion: 'default',
        createdAt: new Date().toISOString(),
        suspended: false,
        version: 'latest'
      };
      
      // Generate and store auth token for the database
      const authToken = await this.getDatabaseAuthToken(database.name);
      database.authToken = authToken;
      
      // Store database info including auth token in InstantDB for the user
      await this.saveUserDatabaseInfoToInstantDB(userId, database);

      console.log(`✓ Created Turso database for user ${userId}: ${database.name}`);
      return database;
    } catch (error) {
      console.error('Error creating Turso database:', error);
      throw error;
    }
  }

  // Get user's database info from InstantDB
  async getUserDatabaseInfoFromInstantDB(userId: string): Promise<TursoDatabase | null> {
    try {
      console.log(`Retrieving Turso DB info from InstantDB for user ${userId}`);
      
      // Query InstantDB for the user's app which contains Turso DB info
      const { data } = await db.queryOnce({
        app: {
          $users: { $: { where: { id: userId } } }
        }
      } as any);
      
      console.log(`Found ${data?.app?.length || 0} apps for user ${userId}`);
      
      const userApp = data?.app?.find((app: any) => 
        app.$users?.some((u: any) => u.id === userId)
      );
      
      console.log(`User app found for retrieval: ${!!userApp}`, {
        appId: userApp?.id,
        hasTursoDbName: !!userApp?.tursoDbName,
        tursoDbName: userApp?.tursoDbName
      });
      
      // Check if Turso DB info exists
      if (userApp?.tursoDbName) {
        return {
          id: '', // Not stored in InstantDB, but not needed for URL generation
          name: userApp.tursoDbName,
          hostname: `${userApp.tursoDbName}-${this.orgName}.turso.io`,
          region: 'default',
          primaryRegion: 'default',
          createdAt: new Date().toISOString(),
          suspended: false,
          version: 'latest',
          authToken: userApp.tursoDbAuthToken,
        };
      }
      
      console.log('No Turso DB info found in InstantDB for user', userId);
      return null;
    } catch (error) {
      console.error('Error getting user database info from InstantDB:', error);
      return null;
    }
  }

  // Save user's database info to InstantDB
  async saveUserDatabaseInfoToInstantDB(userId: string, database: TursoDatabase): Promise<void> {
    try {
      console.log(`Attempting to save Turso DB info for user ${userId}`);
      
      // Find the user's app in InstantDB
      const { data } = await db.queryOnce({
        app: {
          $users: { $: { where: { id: userId } } }
        }
      } as any);
      
      console.log(`Found ${data?.app?.length || 0} apps for user ${userId}`);
      
      const userApp = data?.app?.find((app: any) => 
        app.$users?.some((u: any) => u.id === userId)
      );
      
      console.log(`User app found: ${!!userApp}`, userApp?.id);
      
      if (userApp) {
        // Update the app with Turso database info
        console.log(`Updating app ${userApp.id} with Turso DB info:`, {
          name: database.name,
          hostname: database.hostname
        });
        
        await db.transact([
          db.tx.app[userApp.id].update({
            tursoDbName: database.name,
            tursoDbAuthToken: database.authToken,
          })
        ] as any);
        
        console.log('✓ Successfully saved Turso database info to InstantDB');
      } else {
        console.warn('Could not find user app to save Turso database info');
      }
    } catch (error) {
      console.error('Error saving user database info to InstantDB:', error);
      throw error;
    }
  }

  // Check if user already has a database
  async userDatabaseExists(userId: string): Promise<boolean> {
    const dbInfo = await this.getUserDatabaseInfoFromInstantDB(userId);
    const exists = !!dbInfo;
    console.log(`Turso database exists for user ${userId}: ${exists}`);
    return exists;
  }

  // Get database auth token for client access
  async getDatabaseAuthToken(dbName: string): Promise<string> {
    try {
      const response = await fetch(`${TURSO_API_URL}/v1/organizations/${this.orgName}/databases/${dbName}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: {
            read: true,
            write: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get database auth token: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.jwt;
    } catch (error) {
      console.error('Error getting database auth token:', error);
      throw error;
    }
  }

  // Create database URL with auth token
  async getDatabaseUrl(dbName: string, storedAuthToken?: string): Promise<{ url: string; authToken: string }> {
    try {
      // Use stored auth token if available, otherwise generate a new one
      const authToken = storedAuthToken || await this.getDatabaseAuthToken(dbName);
      
      // Construct database URL
      const url = `libsql://${dbName}-${this.orgName}.turso.io`;
      
      return { url, authToken };
    } catch (error) {
      console.error('Error getting database URL:', error);
      throw error;
    }
  }
  
  // Clear token (for sign out)
  async clearToken(): Promise<void> {
    // No token to clear in this implementation
  }
}

// Export singleton instance
export const tursoService = new TursoService();