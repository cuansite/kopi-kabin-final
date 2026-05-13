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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLoading(true);
        setServerError(false);
        fetchProfile();
      } else {
        setProfile(null);
        setServerError(false);
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
    <AuthContext.Provider value={{ user: profile, userData, loading, serverError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
