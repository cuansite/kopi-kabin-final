import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const migrationSQL = `
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT NULL;
COMMENT ON COLUMN profiles.daily_target IS 'Daily delivery target for kurir staff (number of deliveries)';
`;

async function runMigration() {
  try {
    const { error } = await supabaseAdmin.rpc('exec', { sql: migrationSQL });
    if (error) {
      console.error('Migration error:', error);
      process.exit(1);
    }
    console.log('✓ Migration applied successfully: added daily_target column to profiles table');
  } catch (err) {
    console.error('Error running migration:', err);
    process.exit(1);
  }
}

runMigration();
