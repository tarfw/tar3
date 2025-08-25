import LoadingScreen from '@/components/LoadingScreen';
import { db, id } from '@/lib/instant';
import { instantPlatformService, InstantPlatformService } from '@/lib/instantPlatformService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// App initialization state machine
type AppInitState = 
  | 'idle'
  | 'loading-cache'
  | 'loading-fresh'
  | 'creating-app'
  | 'ready'
  | 'error';

type AppInitError = {
  code: string;
  message: string;
  retryable: boolean;
};

type AuthContextType = {
  user: any;
  userApp: any | null;
  isLoading: boolean;
  appInitState: AppInitState;
  appInitError: AppInitError | null;
  error: any;
  signOut: () => Promise<void>;
  refreshUserApp: () => Promise<void>;
  retryAppInit: () => Promise<void>;
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
  const [appInitState, setAppInitState] = useState<AppInitState>('idle');
  const [appInitError, setAppInitError] = useState<AppInitError | null>(null);
  const initializationRef = useRef<{ userId?: string; promise?: Promise<void> }>({});

  // Cache keys
  const getUserAppCacheKey = (userId: string) => `user_app_${userId}`;
  const getUserAppIdCacheKey = (userId: string) => `user_app_id_${userId}`;
  const getUserAppCreatedFlagKey = (userId: string) => `user_app_created_${userId}`;

  // Single effect for app initialization - simplified and optimistic
  useEffect(() => {
    if (user?.id && appInitState === 'idle') {
      initializeUserApp(user.id);
    } else if (!user?.id) {
      // Reset state when user logs out
      resetAppState();
    }
  }, [user?.id, appInitState]);

  // Navigation effect - simplified
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, authLoading, segments]);

  // Optimized initialization with state machine
  const initializeUserApp = useCallback(async (userId: string) => {
    // Prevent duplicate initialization for same user
    if (initializationRef.current.userId === userId && initializationRef.current.promise) {
      return initializationRef.current.promise;
    }

    const initPromise = performAppInitialization(userId);
    initializationRef.current = { userId, promise: initPromise };
    
    try {
      await initPromise;
    } finally {
      initializationRef.current = {};
    }
  }, []);

  const performAppInitialization = async (userId: string) => {
    try {
      setAppInitState('loading-cache');
      setAppInitError(null);
      
      // Step 1: Load from cache optimistically (immediate UI feedback)
      const cachedData = await loadFromCache(userId);
      if (cachedData) {
        setUserApp(cachedData);
        console.log('✓ Loaded app from cache');
      }
      
      // Step 2: Fetch fresh data in background and update if different
      setAppInitState('loading-fresh');
      const freshData = await loadFromDatabase(userId);
      
      if (freshData) {
        // Update if we have fresh data
        if (!cachedData || (freshData.updatedAt && (!cachedData.updatedAt || freshData.updatedAt > cachedData.updatedAt))) {
          setUserApp(freshData);
          await cacheAppData(userId, freshData);
          console.log('✓ Updated with fresh data');
        }
        setAppInitState('ready');
      } else {
        // No existing app - create new one
        if (!cachedData) {
          await createNewApp(userId);
        } else {
          setAppInitState('ready');
        }
      }
    } catch (error: any) {
      console.error('App initialization error:', error);
      setAppInitError({
        code: error?.code || 'INIT_ERROR',
        message: error?.message || 'Failed to initialize app',
        retryable: true
      });
      setAppInitState('error');
    }
  };

  const loadFromCache = async (userId: string) => {
    try {
      const cachedApp = await AsyncStorage.getItem(getUserAppCacheKey(userId));
      if (cachedApp) {
        return JSON.parse(cachedApp);
      }
    } catch (error) {
      console.warn('Cache load failed:', error);
      // Clear corrupted cache
      await clearUserAppCache(userId);
    }
    return null;
  };

  const loadFromDatabase = async (userId: string) => {
    try {
      // Query foundation DB for existing app
      const { data } = await db.queryOnce({
        app: {
          $users: { $: { where: { id: userId } } }
        }
      });
      
      const existingApp = data?.app?.find(app => 
        app.$users?.some(u => u.id === userId)
      );
      
      if (existingApp?.appid) {
        return await loadExistingApp(existingApp.appid, false);
      }
    } catch (error) {
      console.warn('Database query failed:', error);
    }
    return null;
  };

  const createNewApp = async (userId: string) => {
    setAppInitState('creating-app');
    
    // Check if we already have a creation flag
    const appCreatedFlag = await AsyncStorage.getItem(getUserAppCreatedFlagKey(userId));
    if (appCreatedFlag) {
      console.log('App creation already attempted for user');
      setAppInitState('ready');
      return;
    }
    
    console.log('Creating new app for user:', userId);
    await createDefaultApp();
    setAppInitState('ready');
  };

  const cacheAppData = async (userId: string, appData: any) => {
    try {
      await AsyncStorage.setItem(getUserAppCacheKey(userId), JSON.stringify(appData));
      await AsyncStorage.setItem(getUserAppIdCacheKey(userId), appData.id);
    } catch (error) {
      console.warn('Failed to cache app data:', error);
    }
  };

  const resetAppState = () => {
    setUserApp(null);
    setAppInitState('idle');
    setAppInitError(null);
    initializationRef.current = {};
  };

  // Retry mechanism for failed initialization
  const retryAppInit = useCallback(async () => {
    if (user?.id) {
      setAppInitState('idle');
      await initializeUserApp(user.id);
    }
  }, [user?.id, initializeUserApp]);

  const loadExistingApp = async (appId: string, shouldCache: boolean = false) => {
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
      const foundApp = apps.find(app => app.id === appId);
      
      if (foundApp) {
        // Cache the app data if requested
        if (shouldCache && user?.id) {
          await cacheAppData(user.id, foundApp);
        }
        return foundApp;
      }
    } catch (error) {
      console.error('Error loading existing app:', error);
      throw error;
    }
    return null;
  };

  const createDefaultApp = async () => {
    if (!user) return;

    try {
      // Initialize platform service
      const platformToken = process.env.EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN;
      if (!platformToken) {
        throw new Error('EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN not set');
      }

      if (!instantPlatformService.isInitialized()) {
        await instantPlatformService.saveToken(platformToken);
      }

      // Create app with default template
      const newApp = await instantPlatformService.createApp({
        title: user.email?.split('@')[0] || 'User',
        schema: InstantPlatformService.createBasicTodoSchema(),
        perms: InstantPlatformService.createBasicTodoPermissions(),
      });

      // Link to user in foundation DB
      try {
        await db.transact([
          db.tx.app[id()].update({
            appid: newApp.id
          }).link({ $users: user.id })
        ]);
      } catch (linkError) {
        console.warn('Failed to link app to foundation DB:', linkError);
        // Continue - app was created successfully
      }

      setUserApp(newApp);
      
      // Cache the newly created app and set creation flag
      if (user?.id) {
        await cacheAppData(user.id, newApp);
        await AsyncStorage.setItem(getUserAppCreatedFlagKey(user.id), 'true');
      }
      
      console.log('✓ Created new app for user');
    } catch (error) {
      console.error('Error creating default app:', error);
      throw error;
    }
  };

  const refreshUserApp = useCallback(async () => {
    if (user?.id && userApp?.id) {
      const refreshedApp = await loadExistingApp(userApp.id, true);
      if (refreshedApp) {
        setUserApp(refreshedApp);
      }
    }
  }, [user?.id, userApp?.id]);

  const clearUserAppCache = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (targetUserId) {
      try {
        await AsyncStorage.removeItem(getUserAppCacheKey(targetUserId));
        await AsyncStorage.removeItem(getUserAppIdCacheKey(targetUserId));
        await AsyncStorage.removeItem(getUserAppCreatedFlagKey(targetUserId));
        console.log('Cleared app cache and creation flag for user:', targetUserId);
      } catch (error) {
        console.error('Error clearing app cache:', error);
      }
    }
  };

  const signOut = useCallback(async () => {
    try {
      // Clear app state first
      resetAppState();
      
      // Clear app cache
      await clearUserAppCache();
      
      // Clear platform service token
      await instantPlatformService.clearToken();
      
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

  // Show loading screen only while checking auth state
  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userApp,
      isLoading: authLoading,
      appInitState,
      appInitError,
      error, 
      signOut,
      refreshUserApp,
      retryAppInit
    }}>
      {children}
    </AuthContext.Provider>
  );
}