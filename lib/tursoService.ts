// Turso Service - Handles creating Turso databases for users
import { createClient } from '@libsql/client';

export const tursoService = {
  /**
   * Create a Turso database for a user
   * @param userId The user's ID
   * @param userEmail The user's email (optional)
   * @returns Database information
   */
  async createUserDatabase(userId: string, userEmail?: string): Promise<any> {
    try {
      console.log(`[Turso Debug] Starting Turso database creation for user ${userId}`);
      
      // Get Turso API token from environment variables
      const tursoApiToken = process.env.EXPO_PUBLIC_TURSO_API_TOKEN;
      if (!tursoApiToken) {
        throw new Error('EXPO_PUBLIC_TURSO_API_TOKEN not set');
      }
      console.log(`[Turso Debug] API token found: ${tursoApiToken ? 'YES' : 'NO'}`);

      // Get Turso group from environment variables (defaulting to 'default')
      const tursoGroup = process.env.EXPO_PUBLIC_TURSO_GROUP || 'default';
      console.log(`[Turso Debug] Using group: ${tursoGroup}`);

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
      
      console.log(`[Turso Debug] Generated database name: ${dbName}`);
      
      // Create database via Turso API
      console.log(`[Turso Debug] Creating database via API...`);
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

      console.log(`[Turso Debug] Database creation response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Turso Debug] Database creation failed: ${errorText}`);
        throw new Error(`Turso API error: ${response.status} - ${errorText}`);
      }

      const database = await response.json();
      console.log(`[Turso Debug] Database creation response:`, JSON.stringify(database, null, 2));
      
      // Get database auth token
      console.log(`[Turso Debug] Creating auth token via API...`);
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

      console.log(`[Turso Debug] Auth token response status: ${authResponse.status}`);
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error(`[Turso Debug] Auth token creation failed: ${errorText}`);
        throw new Error(`Turso Auth API error: ${authResponse.status} - ${errorText}`);
      }

      const authResult = await authResponse.json();
      console.log(`[Turso Debug] Auth token response:`, JSON.stringify(authResult, null, 2));
      
      // Extract auth token - try multiple possible structures
      let authToken = null;
      if (authResult && authResult.token) {
        authToken = authResult.token;
        console.log(`[Turso Debug] Extracted token from authResult.token`);
      } else if (authResult && authResult.authToken) {
        authToken = authResult.authToken;
        console.log(`[Turso Debug] Extracted token from authResult.authToken`);
      } else if (authResult && authResult.jwt) {
        authToken = authResult.jwt;
        console.log(`[Turso Debug] Extracted token from authResult.jwt`);
      } else {
        console.log(`[Turso Debug] Could not extract auth token from response`);
      }
      
      console.log(`[Turso Debug] Final auth token: ${authToken ? '[PRESENT]' : '[MISSING]'}`);

      // Extract database URL from response - try multiple possible structures
      let dbUrl = '';
      
      // Try different possible response structures
      if (database && database.db && database.db.url) {
        dbUrl = database.db.url; // New structure
        console.log(`[Turso Debug] Using db.url structure`);
      } else if (database && database.database && database.database.dbUrl) {
        dbUrl = database.database.dbUrl; // Old structure
        console.log(`[Turso Debug] Using database.dbUrl structure`);
      } else if (database && database.dbUrl) {
        dbUrl = database.dbUrl; // Direct field
        console.log(`[Turso Debug] Using direct dbUrl structure`);
      } else if (database && database.hostname) {
        dbUrl = `libsql://${database.hostname}`; // Hostname field
        console.log(`[Turso Debug] Using hostname structure`);
      } else if (database && database.db && database.db.host) {
        dbUrl = `libsql://${database.db.host}`; // Host field
        console.log(`[Turso Debug] Using db.host structure`);
      } else {
        // Construct URL from database name if not in response
        dbUrl = `libsql://${dbName}.turso.io`;
        console.log(`[Turso Debug] Using constructed URL structure`);
      }

      console.log(`[Turso Debug] Final database URL: ${dbUrl}`);

      // Validate that we have a proper database URL
      if (!dbUrl || !dbUrl.startsWith('libsql://')) {
        throw new Error('Invalid database URL received from Turso API');
      }

      const result = {
        name: dbName,
        url: dbUrl,
        authToken: authToken,
      };
      
      console.log(`[Turso Debug] Final result:`, result);
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