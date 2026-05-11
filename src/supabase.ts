import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = ((import.meta as any).env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type AuthRecord = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kurir';
  status: 'active' | 'inactive';
};
