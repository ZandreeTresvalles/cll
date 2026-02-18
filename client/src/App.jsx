// App.jsx
// Updated with Supabase authentication + Lazada account check + Data Sync + Role-Based Access Control
// Fixed: Role loading no longer blocks the app

import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { auth, supabase } from "./lib/supabase";
import { AccountManager } from "./utils/AccountManager";

// Pages
import Login from "./Auth/Login";
import LazadaAuth from "./pages/LazadaAuth";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";
import OrderItems from "./pages/OrderItems";
import Ffr from "./pages/Ffr";
import DataInsights from "./pages/DataInsights";
import SyncDashboard from "./components/SyncDashboard";
import Settings from "./pages/Settings";
import UserCreation from "./pages/UserCreation";

// Components
import Sidebar from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { NotificationProvider } from "./utils/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// ROLE PERMISSIONS CONFIGURATION
// ============================================

const ROLE_PERMISSIONS = {
  admin: {
    pages: ['dashboard', 'orders', 'ffr', 'data_insights', 'sync', 'settings', 'users'],
    canAddStore: true,
    canManageUsers: true,
    canSync: true,
    canExport: true,
    canDeleteData: true,
  },
  warehouse: {
    pages: ['orders', 'ffr'],
    canAddStore: false,
    canManageUsers: false,
    canSync: true,
    canExport: true,
    canDeleteData: false,
  },
  marketing: {
    pages: ['data_insights'],
    canAddStore: false,
    canManageUsers: false,
    canSync: true,
    canExport: true,
    canDeleteData: false,
  },
};

// ============================================
// AUTH CONTEXT (with Role Support)
// ============================================

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Auth Provider Component
function AuthProvider({ children }) {
  // Initialize from localStorage cache for instant load on refresh
  const cachedProfile = localStorage.getItem('userProfile');
  const initialProfile = cachedProfile ? JSON.parse(cachedProfile) : null;
  
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  // If we have cached profile, don't show loading - verify in background
  const [loading, setLoading] = useState(!initialProfile);
  const [lazadaAccounts, setLazadaAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  // Role state - initialize from cache if available
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [roleLoading, setRoleLoading] = useState(!initialProfile); // Don't show loading if we have cached profile
  
  // Ref to track if profile has been loaded (persists across re-renders)
  const profileLoadedRef = useRef(!!initialProfile);
  
  // Helper to update profile and cache it
  const updateUserProfile = useCallback((profile) => {
    setUserProfile(profile);
    if (profile) {
      localStorage.setItem('userProfile', JSON.stringify(profile));
      profileLoadedRef.current = true;
    } else {
      localStorage.removeItem('userProfile');
      profileLoadedRef.current = false;
    }
  }, []);

  // Fetch user profile with role
  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) {
      updateUserProfile(null);
      setRoleLoading(false);
      return;
    }

    // Only show loading if we don't have a cached profile
    if (!profileLoadedRef.current) {
      setRoleLoading(true);
    }
    
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        
        // If no profile exists, try to create one with default role
        if (error.code === 'PGRST116') {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                  role: 'warehouse', // Default to warehouse for new users
                })
                .select()
                .single();

              if (!createError && newProfile) {
                console.log('Created new profile with role:', newProfile.role);
                updateUserProfile(newProfile);
                setRoleLoading(false);
                return;
              }
            }
          } catch (createError) {
            console.warn('Could not create profile:', createError);
          }
        }
        
        // If we still don't have a profile, create a temporary one with default role
        console.warn('Setting default warehouse profile');
        updateUserProfile({ role: 'warehouse', id: userId });
      } else {
        console.log('Profile loaded with role:', profile.role);
        updateUserProfile(profile);
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      // Set default profile to prevent infinite loops
      updateUserProfile({ role: 'warehouse', id: userId });
    } finally {
      setRoleLoading(false);
    }
  }, [updateUserProfile]);

  // Fetch Lazada accounts when user is authenticated
  const fetchLazadaAccounts = async () => {
    if (!session) {
      setLazadaAccounts([]);
      return;
    }

    setAccountsLoading(true);
    try {
      const accounts = await AccountManager.getAccounts(true);
      setLazadaAccounts(accounts);
    } catch (error) {
      console.error('Failed to fetch Lazada accounts:', error);
      setLazadaAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session } = await auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Valid session - fetch/verify profile in background
          await fetchUserProfile(session.user.id);
        } else {
          // No valid session - clear any cached profile
          updateUserProfile(null);
          setRoleLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        // Clear cached data on error
        updateUserProfile(null);
        setRoleLoading(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Only load profile if we haven't loaded one yet
          // This prevents showing loading spinner on token refresh or tab switch
          if (!profileLoadedRef.current) {
            setRoleLoading(true);
            setSession(session);
            setUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            // Profile already loaded - just update session/user silently
            setSession(session);
            setUser(session.user);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token was refreshed - just update session, don't reload anything
          setSession(session);
          setUser(session.user);
          // Don't change roleLoading or userProfile
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          updateUserProfile(null); // This also clears localStorage
          setRoleLoading(false);
          // Clear account data on sign out
          await AccountManager.clearAll();
          setLazadaAccounts([]);
        } else if (event === 'INITIAL_SESSION') {
          // Already handled in getInitialSession
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, updateUserProfile]);

  // Fetch Lazada accounts when session changes
  useEffect(() => {
    if (session) {
      fetchLazadaAccounts();
    }
  }, [session]);

  const signOut = async () => {
    await AccountManager.clearAll();
    await auth.signOut();
  };

  // Role helper functions - default to null until profile loads
  const role = userProfile?.role || null;
  const permissions = role ? ROLE_PERMISSIONS[role] : null;

  const hasPageAccess = useCallback((pageName) => {
    // If role not loaded yet, deny access (will wait for roleLoading)
    if (!role || !permissions) return false;
    return permissions.pages.includes(pageName);
  }, [role, permissions]);

  const hasPermission = useCallback((permissionName) => {
    // If role not loaded yet, deny sensitive permissions
    if (!role || !permissions) return false;
    return permissions[permissionName] === true;
  }, [role, permissions]);

  // Only consider admin if role is explicitly 'admin'
  const isAdmin = role === 'admin';
  const isWarehouse = role === 'warehouse';
  const isMarketing = role === 'marketing';

  // Get correct default path based on role
  const getDefaultPath = useCallback(() => {
    // Return specific paths based on role
    if (role === 'admin') return '/dashboard';
    if (role === 'warehouse') return '/orders';
    if (role === 'marketing') return '/data_insights';
    // Default while loading - will be corrected once role loads
    return '/orders';
  }, [role]);

  const value = {
    // Auth
    user,
    session,
    loading,
    signOut,
    // Consider authenticated if we have session OR cached profile (will verify in background)
    isAuthenticated: !!session || !!userProfile,
    
    // Lazada accounts
    lazadaAccounts,
    accountsLoading,
    hasLazadaAccounts: lazadaAccounts.length > 0,
    refreshLazadaAccounts: fetchLazadaAccounts,
    
    // Role-based access
    userProfile,
    role,
    permissions,
    roleLoading,
    isAdmin,
    isWarehouse,
    isMarketing,
    hasPageAccess,
    hasPermission,
    getDefaultPath,
    refreshUserProfile: () => fetchUserProfile(user?.id),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// LAYOUT COMPONENT
// ============================================

function Layout({ children }) {
  const location = useLocation();
  const { isAuthenticated, signOut, loading } = useAuth();
  
  // Pages that don't need sidebar
  const authPages = ['/', '/login', '/callback', '/lazada-auth'];
  const isAuthPage = authPages.includes(location.pathname) || location.pathname.startsWith('/callback');

  // Show loading state only for initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't show sidebar/topnav on auth pages
  if (isAuthPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <TopNav onLogout={signOut} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ============================================
// ROUTE GUARDS (Fixed - no infinite loops)
// ============================================

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

// Protected Route Component (basic auth check)
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Protected Route that checks role access
function ProtectedRouteWithLazada({ children, requiredPage }) {
  const { isAuthenticated, loading, roleLoading, role, userProfile } = useAuth();
  const location = useLocation();

  // Wait for auth
  if (loading) return <LoadingSpinner />;
  
  // Not authenticated - go to login
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Wait for role to load - MUST have userProfile before proceeding
  if (roleLoading || !userProfile) return <LoadingSpinner />;

  // Now we have the role - check access
  const permissions = ROLE_PERMISSIONS[role];
  const hasAccess = permissions?.pages?.includes(requiredPage);

  // If no access to this page, redirect to their default page
  if (requiredPage && !hasAccess) {
    const defaultPage = role === 'admin' ? '/dashboard' : 
                        role === 'warehouse' ? '/orders' : 
                        role === 'marketing' ? '/data_insights' : '/orders';
    
    // Prevent redirect loop - if we're already on the default page, just show content
    if (location.pathname === defaultPage) {
      return children;
    }
    return <Navigate to={defaultPage} replace />;
  }

  return children;
}

// Admin-only Route
function AdminRoute({ children }) {
  const { isAuthenticated, loading, roleLoading, role, userProfile } = useAuth();
  const location = useLocation();

  // Wait for auth
  if (loading) return <LoadingSpinner />;
  
  // Not authenticated - go to login
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Wait for role to load - MUST have userProfile before proceeding
  if (roleLoading || !userProfile) return <LoadingSpinner />;

  // Redirect non-admins to their default page
  if (role !== 'admin') {
    const defaultPage = role === 'warehouse' ? '/orders' : 
                        role === 'marketing' ? '/data_insights' : '/orders';
    return <Navigate to={defaultPage} replace />;
  }

  return children;
}

// Public Route - redirect to appropriate page if already logged in
function PublicRoute({ children }) {
  const { isAuthenticated, loading, roleLoading, role, userProfile } = useAuth();

  // Wait for auth check
  if (loading) return <LoadingSpinner />;

  // Not authenticated - show login page
  if (!isAuthenticated) return children;

  // Authenticated - wait for role to load before redirecting
  if (roleLoading || !userProfile) return <LoadingSpinner />;

  // Now redirect based on role
  const defaultPage = role === 'admin' ? '/dashboard' : 
                      role === 'warehouse' ? '/orders' : 
                      role === 'marketing' ? '/data_insights' : '/orders';
  
  return <Navigate to={defaultPage} replace />;
}

// ============================================
// APP ROUTES
// ============================================

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Lazada OAuth - requires admin role */}
        <Route
          path="/lazada-auth"
          element={
            <AdminRoute>
              <LazadaAuth apiUrl={API_URL} />
            </AdminRoute>
          }
        />
        <Route
          path="/callback"
          element={<Callback apiUrl={API_URL} />}
        />

        {/* Protected Routes - require login and Lazada account */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRouteWithLazada requiredPage="dashboard">
              <Dashboard apiUrl={API_URL} />
            </ProtectedRouteWithLazada>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRouteWithLazada requiredPage="orders">
              <OrderItems apiUrl={API_URL} />
            </ProtectedRouteWithLazada>
          }
        />
        <Route
          path="/ffr"
          element={
            <ProtectedRouteWithLazada requiredPage="ffr">
              <Ffr apiUrl={API_URL} />
            </ProtectedRouteWithLazada>
          }
        />
        <Route
          path="/data_insights"
          element={
            <ProtectedRouteWithLazada requiredPage="data_insights">
              <DataInsights apiUrl={API_URL} />
            </ProtectedRouteWithLazada>
          }
        />
        
        {/* Data Sync Dashboard */}
        <Route
          path="/sync"
          element={
            <ProtectedRouteWithLazada requiredPage="sync">
              <SyncDashboard />
            </ProtectedRouteWithLazada>
          }
        />
        
        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRouteWithLazada requiredPage="settings">
              <Settings apiUrl={API_URL} />
            </ProtectedRouteWithLazada>
          }
        />

        {/* User Management - Admin only */}
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserCreation />
            </AdminRoute>
          }
        />

        {/* 404 Redirect - redirect to login, PublicRoute will redirect to correct page */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Layout>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

function App() {
  return (
    <BrowserRouter basename="/cll">
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;