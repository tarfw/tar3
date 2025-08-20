import LoadingScreen from '@/components/LoadingScreen';
import { db, id } from '@/lib/instant';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { instantPlatformService, InstantPlatformService } from '@/lib/instantPlatformService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  user: any;
  userApp: any;
  isLoading: boolean;
  isAppLoading: boolean;
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
  const [userApp, setUserApp] = useState(null);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [appCacheChecked, setAppCacheChecked] = useState(false);

  // Cache keys
  const getUserAppCacheKey = (userId: string) => `user_app_${userId}`;
  const getUserAppIdCacheKey = (userId: string) => `user_app_id_${userId}`;
  const getUserAppCreatedFlagKey = (userId: string) => `user_app_created_${userId}`;

  // Load cached app data first, then check for updates if needed
  useEffect(() => {
    if (user?.id && !appCacheChecked) {
      loadCachedAppData();
    } else if (!user?.id) {
      // Reset cache check when user logs out
      setAppCacheChecked(false);
    }
  }, [user?.id]);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    if (user?.id && !appCacheChecked) {
      const timeout = setTimeout(() => {
        console.log('Cache check timeout - proceeding without cache');
        setAppCacheChecked(true);
        setIsAppLoading(false);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timeout);
    }
  }, [user?.id, appCacheChecked]);

  // Fallback timeout for app creation - ensures new users get apps
  useEffect(() => {
    if (user?.id && appCacheChecked && !userApp && !isAppLoading) {
      const appCreationTimeout = setTimeout(() => {
        console.log('App creation fallback timeout - forcing app creation for user:', user.id);
        handleFreshUserData();
      }, 3000); // 3 second timeout after cache check

      return () => clearTimeout(appCreationTimeout);
    }
  }, [user?.id, appCacheChecked, userApp, isAppLoading]);

  // Always call useQuery hook, but conditionally enable it
  const shouldQueryDB = user?.id && appCacheChecked && !userApp && !isAppLoading;
  const { data: userData, isLoading: userDataLoading, error: userDataError } = db.useQuery(
    shouldQueryDB ? {
      app: {
        $users: { $: { where: { id: user.id } } }
      }
    } : null
  );

  // Handle fresh data from foundation DB or trigger app creation for new users
  useEffect(() => {
    console.log('App creation effect triggered:', {
      hasUser: !!user,
      userDataLoading,
      userDataError: !!userDataError,
      appCacheChecked,
      hasUserApp: !!userApp,
      isAppLoading,
      shouldTrigger: user && !userDataLoading && appCacheChecked && !userApp && !isAppLoading
    });

    // Trigger app creation even if there's a userDataError (permission issues)
    // This ensures new users get apps even if foundation DB queries fail
    if (user && !userDataLoading && appCacheChecked && !userApp && !isAppLoading) {
      // For new users, userData might be empty object or have empty app array
      console.log('Checking user data for app creation:', { 
        hasUserData: !!userData, 
        appCount: userData?.app?.length || 0,
        userId: user.id,
        hasError: !!userDataError
      });
      handleFreshUserData();
    }
  }, [user, userData, userDataLoading, userDataError, appCacheChecked, isAppLoading]);

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if not authenticated and not in auth group
      router.replace('/sign-in');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [user, authLoading, segments]);

  const loadCachedAppData = async () => {
    if (!user?.id || appCacheChecked) return;

    try {
      setIsAppLoading(true);
      
      // Try to load from cache first
      const cachedApp = await AsyncStorage.getItem(getUserAppCacheKey(user.id));
      const cachedAppId = await AsyncStorage.getItem(getUserAppIdCacheKey(user.id));
      const appCreatedFlag = await AsyncStorage.getItem(getUserAppCreatedFlagKey(user.id));
      
      console.log('Cache check results:', {
        hasCachedApp: !!cachedApp,
        hasCachedAppId: !!cachedAppId,
        hasAppCreatedFlag: !!appCreatedFlag,
        userId: user.id
      });
      
      if (cachedApp && cachedAppId) {
        try {
          // Use cached data immediately for smooth UX
          const appData = JSON.parse(cachedApp);
          setUserApp(appData);
          console.log('Loaded app from cache for user:', user.id);
        } catch (parseError) {
          console.error('Error parsing cached app data:', parseError);
          // Clear corrupted cache
          await AsyncStorage.removeItem(getUserAppCacheKey(user.id));
          await AsyncStorage.removeItem(getUserAppIdCacheKey(user.id));
          await AsyncStorage.removeItem(getUserAppCreatedFlagKey(user.id));
        }
      }
      
    } catch (error) {
      console.error('Error loading cached app data:', error);
    } finally {
      setAppCacheChecked(true);
      setIsAppLoading(false);
    }
  };

  const handleFreshUserData = async () => {
    if (!user || isAppLoading) return;

    // Add a small delay to prevent race conditions
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      setIsAppLoading(true);
      
      // Check if user already has an app creation flag (prevents duplicate creation)
      const appCreatedFlag = await AsyncStorage.getItem(getUserAppCreatedFlagKey(user.id));
      
      if (appCreatedFlag) {
        console.log('User already has app creation flag - checking if app still exists');
        const cachedAppId = await AsyncStorage.getItem(getUserAppIdCacheKey(user.id));
        if (cachedAppId) {
          // Try to load the existing app
          await loadExistingApp(cachedAppId, true);
          return; // Exit early - user already has an app
        }
      }
      
      // Check if user already has an app in foundation DB
      // userData might be undefined for new users or have empty app array
      const existingApp = userData?.app?.find(app => 
        app.$users?.some(u => u.id === user.id)
      );

      console.log('App check result:', { 
        existingApp: !!existingApp, 
        appId: existingApp?.appid,
        userDataExists: !!userData,
        appArrayLength: userData?.app?.length || 0,
        userDataError: !!userDataError,
        hasAppCreatedFlag: !!appCreatedFlag
      });

      if (existingApp?.appid) {
        // User already has app - load and cache it
        console.log('Loading existing app for user:', user.id);
        await loadExistingApp(existingApp.appid, true);
      } else if (!appCreatedFlag) {
        // New user and no creation flag - auto-create app (ONE-TIME CREATION)
        console.log('Creating new app for first-time user:', user.id);
        await createDefaultApp();
      } else {
        console.log('User has creation flag but no app found - may need manual intervention');
      }
    } catch (error) {
      console.error('Error handling fresh user data:', error);
      // For new users, still try to create an app even if there are errors
      const appCreatedFlag = await AsyncStorage.getItem(getUserAppCreatedFlagKey(user.id));
      if (!userApp && !appCreatedFlag) {
        console.log('Fallback: Attempting app creation despite errors');
        try {
          await createDefaultApp();
        } catch (fallbackError) {
          console.error('Fallback app creation also failed:', fallbackError);
        }
      }
    } finally {
      setIsAppLoading(false);
    }
  };

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
        setUserApp(foundApp);
        
        // Cache the app data if requested
        if (shouldCache && user?.id) {
          await AsyncStorage.setItem(getUserAppCacheKey(user.id), JSON.stringify(foundApp));
          await AsyncStorage.setItem(getUserAppIdCacheKey(user.id), appId);
          console.log('Cached app data for user:', user.id);
        }
      } else {
        setUserApp(null);
      }
    } catch (error) {
      console.error('Error loading existing app:', error);
      setUserApp(null);
    }
  };

  const createDefaultApp = async () => {
    if (!user) return;

    try {
      // Initialize platform service
      const platformToken = process.env.EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN;
      if (!platformToken) {
        console.error('EXPO_PUBLIC_INSTANT_PLATFORM_TOKEN not set');
        return;
      }

      if (!instantPlatformService.isInitialized()) {
        await instantPlatformService.saveToken(platformToken);
      }

      // Create app with default template (ONE-TIME CREATION)
      const newApp = await instantPlatformService.createApp({
        title: user.email?.split('@')[0] || 'User',
        schema: InstantPlatformService.createBasicTodoSchema(),
        perms: InstantPlatformService.createBasicTodoPermissions(),
      });

      // Link to user in foundation DB (ONE-TIME LINK)
      try {
        await db.transact([
          db.tx.app[id()].update({
            appid: newApp.id
          }).link({ $users: user.id })
        ]);
        console.log('Successfully linked app to user in foundation DB');
      } catch (linkError) {
        console.error('Error linking app to user in foundation DB:', linkError);
        // Continue anyway - the app was created successfully
        // User can still access it, just won't be linked in foundation DB
        console.log('App created but not linked - user can still access it');
      }

      setUserApp(newApp);
      
      // Cache the newly created app and set creation flag
      if (user?.id) {
        await AsyncStorage.setItem(getUserAppCacheKey(user.id), JSON.stringify(newApp));
        await AsyncStorage.setItem(getUserAppIdCacheKey(user.id), newApp.id);
        await AsyncStorage.setItem(getUserAppCreatedFlagKey(user.id), 'true');
        console.log('Cached newly created app and set creation flag for user:', user.id);
      }
      
      console.log('Successfully created app for new user:', newApp.id);
    } catch (error) {
      console.error('Error creating default app:', error);
      // Don't throw - let user continue, they can create manually later
    }
  };

  const refreshUserApp = async () => {
    if (user?.id && userApp?.id) {
      await loadExistingApp(userApp.id, true);
    }
  };

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

  const signOut = async () => {
    try {
      // Clear app state first
      setUserApp(null);
      setIsAppLoading(false);
      setAppCacheChecked(false);
      
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
  };

  const isLoading = authLoading;

  // Show loading screen only while checking auth state
  // Don't block on app loading for better UX
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userApp,
      isLoading, 
      isAppLoading,
      error, 
      signOut,
      refreshUserApp
    }}>
      {children}
    </AuthContext.Provider>
  );
}