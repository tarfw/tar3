import LoadingScreen from '@/components/LoadingScreen';
import { db, id } from '@/lib/instant';
import { instantPlatformService, InstantPlatformService } from '@/lib/instantPlatformService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type AuthContextType = {
  user: any;
  userApp: any | null;
  userAppRecord: any | null;
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
  const [userAppRecord, setUserAppRecord] = useState<any | null>(null);
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
      setUserAppRecord(null);
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
    } catch (error) {
      console.error('App initialization failed:', error);
    } finally {
      initializationRef.current = {};
      setIsLoading(false);
    }
  }, [user?.email]);

  const performAppInitialization = async (userId: string, userEmail?: string) => {
    try {
      // Reduced logging - only log essential information
      // Check if user already has an app
      const existingAppRecord = await findUserApp(userId);
      
      if (existingAppRecord?.appid) {
        // Load existing app
        const app = await loadExistingApp(existingAppRecord.appid);
        setUserApp(app);
        setUserAppRecord(existingAppRecord);
      } else {
        // Create new app for user
        await createNewAppForUser(userId, userEmail);
      }
    } catch (error) {
      console.error('App initialization error:', error);
      throw error;
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
      console.error('[AuthContext] Error finding user app:', error);
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

  const createNewAppForUser = async (userId: string, userEmail?: string) => {
    try {
      // Reduced logging - only essential messages
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
        title: userEmail?.split('@')[0] || 'User',
        schema: InstantPlatformService.createBasicTodoSchema(),
        perms: InstantPlatformService.createBasicTodoPermissions(),
      });

      let appId;
      // Link to user in foundation DB
      try {
        appId = id();
        await db.transact([
          db.tx.app[appId].update({
            appid: newApp.id
          }).link({ $users: userId })
        ]);
      } catch (linkError) {
        console.warn('Failed to link app to foundation DB:', linkError);
      }

      // Create Turso database for the user (keeping only this part)
      try {
        console.log(`[Auth] Creating Turso database for user ${userId}`);
        const { tursoService } = await import('@/lib/tursoService');
        const tursoDbInfo = await tursoService.createUserDatabase(userId, userEmail);
        console.log(`[Auth] Turso database created successfully for user ${userId}`);
        
        // Store Turso database info in InstantDB (in the same entity that links to the user)
        if (tursoDbInfo && appId) {
          // Execute the transaction
          await db.transact([
            db.tx.app[appId].update({
              tursoDbName: tursoDbInfo.name,
              tursoDbAuthToken: tursoDbInfo.authToken
            })
          ]);
          
          // Verify the data was stored
          try {
            const { data } = await db.queryOnce({
              app: {
                $: { where: { id: appId } }
              }
            });
            const storedApp = data?.app?.find(a => a.id === appId);
            if (storedApp?.tursoDbName && storedApp?.tursoDbAuthToken) {
              console.log(`[Auth] Turso database info stored successfully for user ${userId}`);
            }
          } catch (verifyError) {
            console.warn(`[Auth] Could not verify stored data:`, verifyError);
          }
        }
        
        console.log(`[Step 4-5] ✓ Completed Turso database creation and storage`);
      } catch (tursoError) {
        console.error(`[Step 4-5] Failed to create/store Turso database:`, tursoError);
      }

      setUserApp(newApp);
      if (appId) {
        // Refresh the app record to include Turso information
            try {
              const updatedAppRecord = data?.app?.find(app => app.id === appId);
              if (updatedAppRecord) {
                setUserAppRecord(updatedAppRecord);
                
                // Configure Turso if we have the necessary information
                if (updatedAppRecord.tursoDbName && updatedAppRecord.tursoDbAuthToken) {
                  // Construct the full HTTPS URL from the database name
                  const tursoUrl = `https://${updatedAppRecord.tursoDbName}.turso.io`;
                  const tursoAuthToken = updatedAppRecord.tursoDbAuthToken;
                  
                  // Configure Turso context
                  const { configureTurso } = require('./TursoContext').useTurso();
                  try {
                    configureTurso(tursoUrl, tursoAuthToken);
                    console.log(`[Auth] Turso configured successfully for user ${userId}`);
                  } catch (configError) {
                    console.error('[Auth] Failed to configure Turso context:', configError);
                  }
                }
              }
            } catch (refreshError) {
          console.warn('[AuthContext] Failed to refresh app record:', refreshError);
        }
      }
      // Reduced logging - only log success
      // console.log('✓ Created new app for user');
    } catch (error) {
      console.error('Error creating new app for user:', error);
      throw error;
    }
  };

  const refreshUserApp = useCallback(async () => {
    if (user?.id) {
      try {
        // Refresh the user app record (which contains Turso info)
        const refreshedAppRecord = await findUserApp(user.id);
        if (refreshedAppRecord) {
          setUserAppRecord(refreshedAppRecord);
          
          // Refresh the platform app if we have an appid
          if (refreshedAppRecord.appid && userApp?.id) {
            const refreshedApp = await loadExistingApp(userApp.id);
            if (refreshedApp) {
              setUserApp(refreshedApp);
            }
          }
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
        // Reduced logging - only log in debug mode
        // console.log('Cleared app cache for user:', targetUserId);
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
      userAppRecord,
      isLoading: authLoading || isLoading,
      error, 
      signOut,
      refreshUserApp
    }}>
      {children}
    </AuthContext.Provider>
  );
}