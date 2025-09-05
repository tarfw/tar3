// Turso HTTP Service - Handles HTTP-based interactions with Turso databases
// This avoids the Node.js specific modules that don't work in React Native

export class TursoHttpService {
  private dbUrl: string;
  private authToken: string;

  constructor(dbUrl: string, authToken: string) {
    this.dbUrl = dbUrl;
    this.authToken = authToken;
  }

  /**
   * Execute a query against the Turso database using HTTP
   * @param sql The SQL query to execute
   * @param params Optional parameters for the query
   * @returns The query results
   */
  async executeQuery(sql: string, params: any[] = []): Promise<any> {
    try {
      console.log(`[TursoHttpService] Executing query on ${this.dbUrl}:`, { sql, params });
      
      const response = await fetch(`${this.dbUrl}/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      console.log(`[TursoHttpService] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[TursoHttpService] HTTP error response:`, errorText);
        throw new Error(`Turso HTTP error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[TursoHttpService] Query result:`, JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('[TursoHttpService] Error executing query:', error);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param queries Array of SQL queries to execute
   * @returns The transaction results
   */
  async executeTransaction(queries: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.dbUrl}/v1/transaction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Turso HTTP transaction error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[TursoHttpService] Error executing transaction:', error);
      throw error;
    }
  }

  /**
   * Create a table in the Turso database
   * @param tableName The name of the table to create
   * @param columns Object mapping column names to their types and constraints
   * @returns The result of the table creation
   */
  async createTable(tableName: string, columns: Record<string, string>): Promise<any> {
    try {
      // Build the CREATE TABLE statement
      const columnDefinitions = Object.entries(columns)
        .map(([name, definition]) => `${name} ${definition}`)
        .join(', ');
      
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions})`;
      
      return await this.executeQuery(sql);
    } catch (error) {
      console.error(`[TursoHttpService] Error creating table ${tableName}:`, error);
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
      console.error(`[TursoHttpService] Error inserting into table ${tableName}:`, error);
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
      console.error(`[TursoHttpService] Error selecting from table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update data in a table
   * @param tableName The name of the table to update
   * @param data Object containing the column names and values to update
   * @param conditions WHERE conditions for the update
   * @param params Parameters for the WHERE conditions
   * @returns The result of the update
   */
  async updateTable(tableName: string, data: Record<string, any>, conditions: string, params: any[] = []): Promise<any> {
    try {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(data);
      
      const sql = `UPDATE ${tableName} SET ${setClause} WHERE ${conditions}`;
      
      return await this.executeQuery(sql, [...values, ...params]);
    } catch (error) {
      console.error(`[TursoHttpService] Error updating table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete data from a table
   * @param tableName The name of the table to delete from
   * @param conditions WHERE conditions for the deletion
   * @param params Parameters for the WHERE conditions
   * @returns The result of the deletion
   */
  async deleteFromTable(tableName: string, conditions: string, params: any[] = []): Promise<any> {
    try {
      const sql = `DELETE FROM ${tableName} WHERE ${conditions}`;
      
      return await this.executeQuery(sql, params);
    } catch (error) {
      console.error(`[TursoHttpService] Error deleting from table ${tableName}:`, error);
      throw error;
    }
  }
}