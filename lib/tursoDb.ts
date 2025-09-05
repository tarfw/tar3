// Simple Turso Database Service
// This is a clean implementation based on Turso documentation

export interface TursoDbConfig {
  dbName: string;
  authToken: string;
  orgName?: string;
}

export class TursoDb {
  private config: TursoDbConfig;
  private baseUrl: string;

  constructor(config: TursoDbConfig) {
    this.config = config;
    
    // Use fixed organization name "tarfw" as specified
    this.baseUrl = `https://${config.dbName}-tarfw.turso.io`;
    
    console.log(`[TursoDb] Constructed base URL: ${this.baseUrl}`);
  }

  /**
   * Execute a query against the Turso database
   * @param sql The SQL query to execute
   * @param params Optional parameters for the query
   * @returns The query results
   */
  async executeQuery(sql: string, params: any[] = []): Promise<any> {
    try {
      console.log(`[TursoDb] Executing query:`, { sql, params });
      
      const response = await fetch(`${this.baseUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      console.log(`[TursoDb] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TursoDb] HTTP error response:`, errorText);
        throw new Error(`Turso HTTP error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[TursoDb] Query result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[TursoDb] Error executing query:', error);
      throw error;
    }
  }

  /**
   * Create a table if it doesn't exist
   * @param tableName The name of the table to create
   * @param schema The schema definition for the table
   * @returns The result of the table creation
   */
  async createTable(tableName: string, schema: string): Promise<any> {
    try {
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
      return await this.executeQuery(sql);
    } catch (error) {
      console.error(`[TursoDb] Error creating table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Insert data into a table
   * @param tableName The name of the table to insert into
   * @param data Object containing the column names and values to insert
   * @returns The result of the insertion
   */
  async insertIntoTable(tableName: string, data: Record<string, any>): Promise<any> {
    try {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map(() => '?').join(', ');
      
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      return await this.executeQuery(sql, values);
    } catch (error) {
      console.error(`[TursoDb] Error inserting into table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Select data from a table
   * @param tableName The name of the table to select from
   * @param conditions Optional WHERE conditions
   * @param params Optional parameters for the WHERE conditions
   * @returns The selected data
   */
  async selectFromTable(tableName: string, conditions?: string, params: any[] = []): Promise<any> {
    try {
      let sql = `SELECT * FROM ${tableName}`;
      
      if (conditions) {
        sql += ` WHERE ${conditions}`;
      }
      
      return await this.executeQuery(sql, params);
    } catch (error) {
      console.error(`[TursoDb] Error selecting from table ${tableName}:`, error);
      throw error;
    }
  }
}

// Hook for React Native usage
export function useTursoDb(config: TursoDbConfig | null): TursoDb | null {
  if (!config) {
    return null;
  }
  
  return new TursoDb(config);
}