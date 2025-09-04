import LoadingScreen from '@/components/LoadingScreen';
import { db, id } from '@/lib/instant';
import { instantPlatformService, InstantPlatformService } from '@/lib/instantPlatformService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type AuthContextType = {
  user: any;
  userApp: any | null;
  isLoading: boolean;
  error: any;
  signOut: () => Promise<void>;
  refreshUserApp: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user, error } = db.useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [userApp, setUserApp] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const initializationRef = useRef<{ userId?: string; promise?: Promise<void> }>({});

  // Cache keys (kept for backward compatibility but not actively used)
  const getUserAppCacheKey = (userId: string) => `user_app_${userId}`;
  const getUserAppIdCacheKey = (userId: string) => `user_app_id_${userId}`;

  // Simplified effect for app initialization
  useEffect(() => {
    if (user?.id && !userApp) {
      initializeUserApp(user.id);
    } else if (!user?.id) {
      // Reset state when user logs out
      setUserApp(null);
    }
  }, [user?.id, userApp]);

  // Navigation effect
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading, segments]);

  // Simplified initialization
  const initializeUserApp = useCallback(async (userId: string) => {
    // Prevent duplicate initialization for same user
    if (initializationRef.current.userId === userId && initializationRef.current.promise) {
      return initializationRef.current.promise;
    }

    setIsLoading(true);
    const initPromise = performAppInitialization(userId, user?.email);
    initializationRef.current = { userId, promise: initPromise };
    
    try {
      await initPromise;
    } finally {
      initializationRef.current = {};
      setIsLoading(false);
    }
  }, [user?.email]);

  const performAppInitialization = async (userId: string, userEmail?: string) => {
    try {
      console.log(`Initializing app for user ${userId} with email: ${userEmail}`);
      
      // Check if user already has an app
      const existingApp = await findUserApp(userId);
      
      if (existingApp?.appid) {
        console.log(`Found existing app for user ${userId}: ${existingApp.appid}`);
        // Load existing app
        const app = await loadExistingApp(existingApp.appid);
        setUserApp(app);
        
        // Load user's Turso database info
        await loadUserTursoDatabase(userId);
      } else {
        console.log(`No existing app found for user ${userId}, creating new app`);
        // Create new app for user
        await createNewAppForUser(userId, userEmail);
      }
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const findUserApp = async (userId: string) => {
    try {
      const { data } = await db.queryOnce({
        app: {
          $users: { $: { where: { id: userId } } }
        }
      });
      
      return data?.app?.find(app => 
        app.$users?.some(u => u.id === userId)
      );
    } catch (error) {
      console.error('Error finding user app:', error);
      return null;
    }
  };

  const loadExistingApp = async (appId: string) => {
    try {
      // Initialize platform service if needed
      const platformToken = process.env.EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN;
      if (platformToken && !instantPlatformService.isInitialized()) {
        await instantPlatformService.saveToken(platformToken);
      }

      const apps = await instantPlatformService.getApps({ 
        includeSchema: true, 
        includePerms: true 
      });
      
      return apps.find(app => app.id === appId);
    } catch (error) {
      console.error('Error loading existing app:', error);
      throw error;
    }
  };

  const loadUserTursoDatabase = async (userId: string) => {
    try {
      const { updateUserTursoOptions } = await import('@/contexts/HybridDbContext');
      
      // Get user's app entity which contains Turso configuration
      const { data } = await db.queryOnce({
        app: {
          $users: { $: { where: { id: userId } } }
        }
      });
      
      const userApp = data?.app?.find((app: any) => 
        app.$users?.some((u: any) => u.id === userId)
      );
      
      // Load Turso configuration from the app entity
      if (userApp?.tursoDbName && userApp?.tursoDbAuthToken) {
        // Construct database URL from stored name
        const url = `libsql://${userApp.tursoDbName}-tarfw.turso.io`;
        const authToken = userApp.tursoDbAuthToken;
        updateUserTursoOptions(url, authToken);
        console.log('✓ Loaded user-specific Turso database from InstantDB');
      } else {
        console.log('No Turso database configuration found for user');
      }
    } catch (error) {
      console.warn('Failed to load user Turso database:', error);
    }
  };

  const createNewAppForUser = async (userId: string, userEmail?: string) => {
    try {
      console.log(`Creating new app for user ${userId} with email: ${userEmail}`);
      
      // Initialize platform service
      const platformToken = process.env.EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN;
      if (!platformToken) {
        throw new Error('EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN not set');
      }

      if (!instantPlatformService.isInitialized()) {
        await instantPlatformService.saveToken(platformToken);
      }

      // Create app with default template
      console.log(`Creating InstantDB app for user ${userId} (${userEmail})`);
      const newApp = await instantPlatformService.createApp({
        title: userEmail?.split('@')[0] || 'User',
        schema: InstantPlatformService.createBasicTodoSchema(),
        perms: InstantPlatformService.createBasicTodoPermissions(),
      });
      console.log(`✓ Created InstantDB app ${newApp.id} for user ${userId}`);

      // Link to user in foundation DB
      try {
        console.log(`Linking app ${newApp.id} to user ${userId}`);
        const appId = id();
        await db.transact([
          db.tx.app[appId].update({
            appid: newApp.id
          }).link({ $users: userId })
        ]);
        console.log(`✓ Linked app ${newApp.id} to user ${userId} with entity ID ${appId}`);
      } catch (linkError) {
        console.warn('Failed to link app to foundation DB:', linkError);
      }

      // Create Turso database for the user
      let tursoDbInfo = null;
      try {
        console.log(`Checking if Turso database exists for user ${userId}`);
        const { tursoService } = await import('@/lib/tursoService');
        if (!(await tursoService.userDatabaseExists(userId))) {
          console.log(`Creating Turso database for user ${userId} with email: ${userEmail}`);
          tursoDbInfo = await tursoService.createUserDatabase(userId, userEmail);
          console.log('✓ Created Turso database for user');
        } else {
          console.log(`Retrieving existing Turso database info for user ${userId}`);
          tursoDbInfo = await tursoService.getUserDatabaseInfoFromInstantDB(userId);
          console.log('✓ User already has Turso database');
        }
      } catch (tursoError) {
        console.warn('Failed to create Turso database:', tursoError);
      }

      setUserApp(newApp);
      console.log('✓ Created new app for user');
      
      // Load the Turso database we just created
      if (tursoDbInfo) {
        await loadUserTursoDatabase(userId);
      }
    } catch (error) {
      console.error('Error creating new app for user:', error);
      throw error;
    }
  };

  const refreshUserApp = useCallback(async () => {
    if (user?.id && userApp?.id) {
      try {
        const refreshedApp = await loadExistingApp(userApp.id);
        if (refreshedApp) {
          setUserApp(refreshedApp);
        }
      } catch (error) {
        console.error('Error refreshing user app:', error);
      }
    }
  }, [user?.id, userApp?.id]);

  const clearUserAppCache = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      try {
        await AsyncStorage.removeItem(getUserAppCacheKey(targetUserId));
        await AsyncStorage.removeItem(getUserAppIdCacheKey(targetUserId));
        console.log('Cleared app cache for user:', targetUserId);
      } catch (error) {
        console.error('Error clearing app cache:', error);
      }
    }
  };

  const signOut = useCallback(async () => {
    try {
      // Clear app state
      setUserApp(null);
      
      // Clear app cache
      await clearUserAppCache();
      
      // Clear platform service token
      const { tursoService } = await import('@/lib/tursoService');
      await tursoService.clearToken();
      
      // Sign out from Instant DB
      await db.auth.signOut();
      
      // Navigate to sign-in
      router.replace('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still navigate even if there's an error
      router.replace('/sign-in');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userApp,
      isLoading: authLoading || isLoading,
      error, 
      signOut,
      refreshUserApp
    }}>
      {children}
    </AuthContext.Provider>
  );
}