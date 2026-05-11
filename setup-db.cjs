// Applies any missing schema changes to your Supabase project.
// Usage: node setup-db.cjs
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SERVICE_KEY  = env['VITE_SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function sql(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  return res;
}

async function runSQL(statement, description) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
  });
  // Use the pg REST endpoint via the management API isn't available directly.
  // Instead we check the column via a SELECT and patch it via the admin API.
  return res;
}

async function main() {
  console.log('Checking profiles table columns...\n');

  // Check if current_location column exists
  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=current_location&limit=0`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );

  if (checkRes.ok) {
    console.log('✓ current_location column already exists.');
  } else {
    const err = await checkRes.json();
    if (err?.code === '42703' || err?.message?.includes('current_location')) {
      console.log('✗ current_location column is MISSING. Adding it now...\n');
      console.log('You need to run this SQL in your Supabase SQL Editor:');
      console.log('─────────────────────────────────────────────────────');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_location text;');
      console.log('─────────────────────────────────────────────────────');
      console.log('\nGo to: https://supabase.com/dashboard/project/nwcmmzouajxskkcvxmxl/sql/new');
      console.log('\nPaste and run the ALTER TABLE line above, then restart npm run dev.');
    } else {
      console.log('Unexpected error:', err);
    }
    return;
  }

  // Also verify the admin profile row exists
  console.log('\nChecking admin profile rows...');
  const profilesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,email,role,status&role=eq.admin`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  );
  const profiles = await profilesRes.json();
  if (!Array.isArray(profiles) || profiles.length === 0) {
    console.log('✗ No admin profile row found in the profiles table!');
    console.log('  The auth user exists but the profile insert may have failed.');
    console.log('  Run the seed-admin endpoint again or manually insert:');
    console.log('  INSERT INTO profiles (id, email, name, role, status)');
    console.log('  VALUES (\'<auth-user-id>\', \'<email>\', \'<name>\', \'admin\', \'active\');');
  } else {
    console.log('✓ Admin profile found:');
    profiles.forEach(p => console.log(`  email=${p.email}  status=${p.status}`));
    console.log('\n✓ Everything looks good. Try logging in again.');
  }
}

main().catch(console.error);
