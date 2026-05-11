// One-time script: list admin users and reset password
// Usage: node reset-admin.cjs [new-password]
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY from .env

const fs = require('fs');
const path = require('path');

// Parse .env manually (no dotenv dependency required for CJS)
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

const newPassword = process.argv[2];

async function main() {
  // List all auth users
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  const listData = await listRes.json();
  const users = listData.users ?? [];

  if (users.length === 0) {
    console.log('No users found in Supabase Auth.');
    return;
  }

  console.log('\nUsers in Supabase Auth:');
  users.forEach(u => console.log(`  id=${u.id}  email=${u.email}  confirmed=${!!u.email_confirmed_at}`));

  if (!newPassword) {
    console.log('\nTo reset a password, run:');
    console.log('  node reset-admin.cjs <new-password>');
    console.log('(This will reset the first user in the list above)');
    return;
  }

  const target = users[0];
  console.log(`\nResetting password for ${target.email} ...`);

  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${target.id}`, {
    method: 'PUT',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (updateRes.ok) {
    console.log(`Password reset! You can now log in as ${target.email} with: ${newPassword}`);
  } else {
    const err = await updateRes.json();
    console.error('Failed:', err);
  }
}

main().catch(console.error);
