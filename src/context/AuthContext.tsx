import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import { AuthRecord } from '../supabase';
import { apiRequest } from '../services/api';

export interface UserRole {
  role: 'admin' | 'kurir' | null;
  name: string;
  status: string;
  email: string;
}

interface AuthContextType {
  user: AuthRecord | null;
  userData: UserRole | null;
  loading: boolean;
  serverError: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  serverError: false,
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AuthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<AuthRecord>('/api/me');
      setProfile(data);
      setServerError(false);
    } catch (err: any) {
      setProfile(null);
      const status: number = err?.status ?? 0;
      if (status >= 500 || status === 0) {
        // Server crash or network failure — don't sign out, let the user retry
        setServerError(true);
      } else {
        setServerError(false);
        // 401/403: session valid but no active profile — sign out to clear the loop
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Track the user ID we fetched a profile for, so we can detect cross-tab
    // session hijacking (e.g. a different user logs in on another tab of the
    // same browser, which overwrites localStorage and fires SIGNED_IN here).
    let activeUserId: string | null = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        activeUserId = null;
        setProfile(null);
        setServerError(false);
        setLoading(false);
        return;
      }

      // TOKEN_REFRESHED / USER_UPDATED: same user, token rotated — no need to
      // re-hit the server for profile data that hasn't changed.
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        return;
      }

      // SIGNED_IN or INITIAL_SESSION: verify this is the same user we already
      // have a profile for; if a different user logged in on another tab, force
      // a page reload so this tab starts fresh with the correct session.
      if (activeUserId && activeUserId !== session.user.id) {
        window.location.reload();
        return;
      }

      setLoading(true);
      setServerError(false);
      activeUserId = session.user.id;
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const userData: UserRole | null = useMemo(
    () =>
      profile
        ? { role: profile.role, name: profile.name, status: profile.status, email: profile.email }
        : null,
    [profile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user: profile, userData, loading, serverError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
