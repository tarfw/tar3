// Turso Service - Handles creating Turso databases for users
import { TursoHttpService } from './tursoHttpService';

export const tursoService = {
  /**
   * Create a Turso database for a user
   * @param userId The user's ID
   * @param userEmail The user's email (optional)
   * @returns Database information
   */
  async createUserDatabase(userId: string, userEmail?: string): Promise<any> {
    try {
      // Reduced logging - only log essential information
      console.log(`[Turso] Creating database for user ${userId}`);
      
      // Get Turso API token from environment variables
      const tursoApiToken = process.env.EXPO_PUBLIC_TURSO_API_TOKEN;
      if (!tursoApiToken) {
        throw new Error('EXPO_PUBLIC_TURSO_API_TOKEN not set');
      }

      // Get Turso group from environment variables (defaulting to 'default')
      const tursoGroup = process.env.EXPO_PUBLIC_TURSO_GROUP || 'default';

      // Generate database name based on user email or ID
      let dbName = 'user-db';
      if (userEmail) {
        // Create a clean database name from the email
        const emailPrefix = userEmail.split('@')[0];
        // Remove special characters and limit length
        const cleanEmail = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Add a unique suffix to ensure uniqueness
        const uniqueSuffix = Date.now().toString(36).substring(2, 8);
        dbName = `${cleanEmail}-${uniqueSuffix}`;
      } else {
        // Fallback to user ID if email is not available
        const cleanUserId = userId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const uniqueSuffix = Date.now().toString(36).substring(2, 8);
        dbName = `${cleanUserId}-${uniqueSuffix}`;
      }
      
      // Ensure database name is within limits (Turso has a 30-character limit)
      if (dbName.length > 25) {
        dbName = dbName.substring(0, 25);
      }
      
      // Create database via Turso API
      const response = await fetch('https://api.turso.tech/v1/databases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tursoApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: dbName,
          group: tursoGroup,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Turso API error: ${response.status} - ${errorText}`);
      }

      const database = await response.json();
      
      // Get database auth token
      const authResponse = await fetch(`https://api.turso.tech/v1/databases/${dbName}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tursoApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissions: {
            read: true,
            write: true,
          },
        }),
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Turso Auth API error: ${authResponse.status} - ${errorText}`);
      }

      const authResult = await authResponse.json();
      
      // Extract auth token - try multiple possible structures
      let authToken = null;
      if (authResult && authResult.token) {
        authToken = authResult.token;
      } else if (authResult && authResult.authToken) {
        authToken = authResult.authToken;
      } else if (authResult && authResult.jwt) {
        authToken = authResult.jwt;
      }
      
      // Extract database URL from response - try multiple possible structures
      let dbUrl = '';
      
      // Try different possible response structures
      if (database && database.db && database.db.url) {
        dbUrl = database.db.url; // New structure
      } else if (database && database.database && database.database.dbUrl) {
        dbUrl = database.database.dbUrl; // Old structure
      } else if (database && database.dbUrl) {
        dbUrl = database.dbUrl; // Direct field
      } else if (database && database.hostname) {
        dbUrl = `libsql://${database.hostname}`; // Hostname field
      } else if (database && database.db && database.db.host) {
        dbUrl = `libsql://${database.db.host}`; // Host field
      } else {
        // Construct URL with fixed organization name "tarfw"
        dbUrl = `libsql://${dbName}-tarfw.turso.io`;
      }

      // Validate that we have a proper database URL
      if (!dbUrl || !dbUrl.startsWith('libsql://')) {
        throw new Error('Invalid database URL received from Turso API');
      }

      // Extract the hostname from the libsql URL for HTTPS access
      const hostname = dbUrl.replace('libsql://', '');
      const httpsUrl = `https://${hostname}`;

      const result = {
        name: dbName,
        url: dbUrl, // Keep the libsql URL for compatibility
        httpsUrl: httpsUrl, // Add the HTTPS URL for HTTP-based service
        authToken: authToken,
      };
      
      console.log(`[Turso] Database created successfully for user ${userId}: ${dbName}`);
      return result;
    } catch (error: any) {
      console.error('[Turso] Error creating database:', error);
      
      // Provide more specific error messages
      if (error.message.includes('EXPO_PUBLIC_TURSO_API_TOKEN')) {
        throw new Error('Turso API token is not configured. Please set EXPO_PUBLIC_TURSO_API_TOKEN in your environment variables.');
      }
      
      if (error.message.includes('Turso API error: 401')) {
        throw new Error('Invalid Turso API token. Please check your EXPO_PUBLIC_TURSO_API_TOKEN.');
      }
      
      if (error.message.includes('Turso API error: 409')) {
        throw new Error('Turso database name already exists. Please try again or contact support.');
      }
      
      throw new Error(`Failed to create Turso database: ${error.message}`);
    }
  }
};