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
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signOut: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<AuthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await apiRequest<AuthRecord>('/api/me');
      setProfile(data);
    } catch (err: any) {
      setProfile(null);
      // If the auth session is valid but the user has no profile (or it's
      // inactive), sign them out so they don't stay stuck in a 403 loop on
      // every page load. Otherwise the cached Supabase session keeps
      // re-issuing /api/me requests that always fail.
      const message = String(err?.message ?? '');
      if (
        message.includes('Inactive or unregistered account') ||
        message.includes('Unauthorized') ||
        message.includes('Invalid or expired token') ||
        message.includes('403') ||
        message.includes('401')
      ) {
        await supabase.auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLoading(true); // signal "profile fetch in progress" before the async fetch
        fetchProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
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
    <AuthContext.Provider value={{ user: profile, userData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
