import { PlatformApi, OAuthHandler, i, type InstantRules, type InstantSchemaDef } from '@instantdb/platform';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OAuth Configuration
export const OAUTH_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_INSTANT_OAUTH_CLIENT_ID || 'YOUR_CLIENT_ID',
  redirectUri: process.env.EXPO_PUBLIC_INSTANT_OAUTH_REDIRECT_URI || 'https://your-domain.com/oauth/instant/redirect',
};

// Available OAuth scopes
export const OAUTH_SCOPES = ['apps-read', 'apps-write', 'data-read', 'data-write', 'storage-read', 'storage-write'];

export interface InstantApp {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  schema?: InstantSchemaDef;
  perms?: InstantRules;
}

export interface SchemaStep {
  type: string;
  friendlyDescription: string;
  attr?: any;
  backgroundJob?: {
    id: string;
    status: string;
    error?: string;
    invalidTriplesSample?: any[];
  };
}

export class InstantPlatformService {
  private api: PlatformApi | null = null;
  private oauthHandler: OAuthHandler;

  constructor() {
    this.oauthHandler = new OAuthHandler(OAUTH_CONFIG);
  }

  // Initialize the service with an access token
  initialize(accessToken: string) {
    this.api = new PlatformApi({ auth: { token: accessToken } });
  }

  // Check if the service is initialized
  isInitialized(): boolean {
    return this.api !== null;
  }

  // OAuth Methods
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem('instant_oauth_token', token);
    this.initialize(token);
  }

  async loadSavedToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem('instant_oauth_token');
    if (token) {
      this.initialize(token);
    }
    return token;
  }

  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem('instant_oauth_token');
    this.api = null;
  }

  // Generate OAuth URL for React Native WebBrowser
  generateOAuthUrl(scopes: string[] = OAUTH_SCOPES): string {
    const state = Math.random().toString(36).substring(2, 15);
    return `https://www.instantdb.com/oauth/authorize?client_id=${OAUTH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(OAUTH_CONFIG.redirectUri)}&response_type=code&scope=${scopes.join(' ')}&state=${state}`;
  }

  // Extract authorization code from redirect URL
  extractCodeFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('code');
    } catch {
      return null;
    }
  }

  // App Management Methods
  async getApps(options?: { includeSchema?: boolean; includePerms?: boolean }): Promise<InstantApp[]> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { apps } = await this.api.getApps(options);
      return apps.map(app => ({
        id: app.id,
        title: app.title,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        schema: app.schema,
        perms: app.perms,
      }));
    } catch (error) {
      console.error('Error fetching apps:', error);
      throw new Error('Failed to fetch apps');
    }
  }

  async getApp(appId: string, options?: { includeSchema?: boolean; includePerms?: boolean }): Promise<InstantApp> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { app } = await this.api.getApp(appId, options);
      return {
        id: app.id,
        title: app.title,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        schema: app.schema,
        perms: app.perms,
      };
    } catch (error) {
      console.error('Error fetching app:', error);
      throw new Error('Failed to fetch app');
    }
  }

  async createApp(params: {
    title: string;
    schema?: InstantSchemaDef;
    perms?: InstantRules;
  }): Promise<InstantApp> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { app } = await this.api.createApp(params);
      return {
        id: app.id,
        title: app.title,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        schema: app.schema,
        perms: app.perms,
      };
    } catch (error) {
      console.error('Error creating app:', error);
      throw new Error('Failed to create app');
    }
  }

  async updateApp(appId: string, params: { title?: string }): Promise<InstantApp> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { app } = await this.api.updateApp(appId, params);
      return {
        id: app.id,
        title: app.title,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      };
    } catch (error) {
      console.error('Error updating app:', error);
      throw new Error('Failed to update app');
    }
  }

  async deleteApp(appId: string): Promise<void> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      await this.api.deleteApp(appId);
    } catch (error) {
      console.error('Error deleting app:', error);
      throw new Error('Failed to delete app');
    }
  }

  // Schema Management Methods
  async getSchema(appId: string): Promise<InstantSchemaDef> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { schema } = await this.api.getSchema(appId);
      return schema;
    } catch (error) {
      console.error('Error fetching schema:', error);
      throw new Error('Failed to fetch schema');
    }
  }

  async planSchemaPush(appId: string, schema: InstantSchemaDef): Promise<SchemaStep[]> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { steps } = await this.api.planSchemaPush(appId, { schema });
      return steps;
    } catch (error) {
      console.error('Error planning schema push:', error);
      throw new Error('Failed to plan schema push');
    }
  }

  async schemaPush(
    appId: string, 
    schema: InstantSchemaDef,
    onProgress?: (status: { friendlyDescription: string }) => void
  ): Promise<SchemaStep[]> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const pushPromise = this.api.schemaPush(appId, { schema });
      
      if (onProgress) {
        pushPromise.subscribe({
          next: onProgress,
        });
      }
      
      const { steps } = await pushPromise;
      return steps;
    } catch (error) {
      console.error('Error pushing schema:', error);
      throw new Error('Failed to push schema');
    }
  }

  // Permissions Management Methods
  async getPerms(appId: string): Promise<InstantRules> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      const { perms } = await this.api.getPerms(appId);
      return perms;
    } catch (error) {
      console.error('Error fetching permissions:', error);
      throw new Error('Failed to fetch permissions');
    }
  }

  async pushPerms(appId: string, perms: InstantRules): Promise<void> {
    if (!this.api) throw new Error('Service not initialized');
    
    try {
      await this.api.pushPerms(appId, { perms });
    } catch (error) {
      console.error('Error pushing permissions:', error);
      throw new Error('Failed to push permissions');
    }
  }

  // Schema Helpers
  static createDefaultTaskSchema(): InstantSchemaDef {
    return i.schema({
      entities: {
        task: i.entity({
          title: i.string(),
          description: i.string().optional(),
          type: i.string(),
          status: i.string(),
          priority: i.number().optional(),
          dueDate: i.date().optional(),
          completedAt: i.date().optional(),
          createdAt: i.date(),
          updatedAt: i.date(),
          metadata: i.json(),
        }),
        people: i.entity({
          name: i.string(),
          email: i.string().optional(),
          avatarUrl: i.string().optional(),
        }),
        team: i.entity({
          name: i.string(),
          key: i.string(),
          description: i.string().optional(),
        }),
        project: i.entity({
          name: i.string(),
          description: i.string().optional(),
          state: i.string(),
          startDate: i.date().optional(),
          targetDate: i.date().optional(),
        }),
      },
      links: {
        peopleToTeam: {
          forward: {
            on: "people",
            has: "one",
            label: "team",
          },
          reverse: {
            on: "team",
            has: "many",
            label: "people",
          },
        },
        taskCreator: {
          forward: {
            on: "task",
            has: "one",
            label: "creator",
          },
          reverse: {
            on: "people",
            has: "many",
            label: "createdTasks",
          },
        },
        taskAssigneePeople: {
          forward: {
            on: "task",
            has: "one",
            label: "assigneePerson",
          },
          reverse: {
            on: "people",
            has: "many",
            label: "assignedTasks",
          },
        },
        taskAssigneeTeam: {
          forward: {
            on: "task",
            has: "one",
            label: "assigneeTeam",
          },
          reverse: {
            on: "team",
            has: "many",
            label: "assignedTasks",
          },
        },
        taskTeam: {
          forward: {
            on: "task",
            has: "one",
            label: "team",
          },
          reverse: {
            on: "team",
            has: "many",
            label: "tasks",
          },
        },
        taskProject: {
          forward: {
            on: "task",
            has: "one",
            label: "project",
          },
          reverse: {
            on: "project",
            has: "many",
            label: "tasks",
          },
        },
      },
    });
  }

  static createDefaultTaskPermissions(): InstantRules {
    return {
      $default: {
        allow: {
          $default: false,
        },
      },
      task: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id != null',
          delete: 'auth.id != null',
        },
      },
      people: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id != null',
          delete: 'auth.id != null',
        },
      },
      team: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id != null',
          delete: 'auth.id != null',
        },
      },
      project: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id != null',
          delete: 'auth.id != null',
        },
      },
    };
  }

  static createChatAppSchema(): InstantSchemaDef {
    return i.schema({
      entities: {
        messages: i.entity({
          content: i.string(),
          authorId: i.string(),
          channelId: i.string(),
          createdAt: i.date(),
        }),
        channels: i.entity({
          name: i.string(),
          description: i.string().optional(),
          createdBy: i.string(),
          createdAt: i.date(),
        }),
        users: i.entity({
          name: i.string(),
          email: i.string().unique(),
          avatar: i.string().optional(),
          createdAt: i.date(),
        }),
      },
    });
  }

  static createChatAppPermissions(): InstantRules {
    return {
      $default: {
        allow: {
          $default: false,
        },
      },
      messages: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id == data.authorId',
          delete: 'auth.id == data.authorId',
        },
        bind: ['authorId', 'auth.id'],
      },
      channels: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id == data.createdBy',
          delete: 'auth.id == data.createdBy',
        },
        bind: ['createdBy', 'auth.id'],
      },
      users: {
        allow: {
          view: 'true',
          create: 'auth.id != null',
          update: 'auth.id == data.id',
          delete: 'auth.id == data.id',
        },
      },
    };
  }
}

// Export singleton instance
export const instantPlatformService = new InstantPlatformService();