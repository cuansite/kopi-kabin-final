# Database Migration: Add daily_target Column

## Problem
Error: "column profiles.daily_target does not exist"

The application code references a `daily_target` column in the `profiles` table, but it was never created in the database.

## Solution
Add the missing column to the `profiles` table.

## How to Apply

### Option 1: Supabase Dashboard (Easiest)
1. Go to https://app.supabase.com
2. Select your project (nwcmmzouajxskkcvxmxl)
3. Click "SQL Editor" in the sidebar
4. Click "New query"
5. Paste this SQL:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT NULL;
COMMENT ON COLUMN profiles.daily_target IS 'Daily delivery target for kurir staff (number of deliveries)';
```

6. Click "Run"

### Option 2: Supabase CLI
```bash
cd /Users/macbookpro/Downloads/kopi-kabin-final-main

# Install Supabase CLI (if not already installed)
npm install -g supabase

# Authenticate
supabase login

# Link to your project
supabase link --project-ref nwcmmzouajxskkcvxmxl

# Push migrations
supabase db push
```

### Option 3: Command Line (psql)
```bash
# Export credentials
export PGPASSWORD="your-database-password"

# Run SQL
psql -h db.nwcmmzouajxskkcvxmxl.supabase.co \
     -U postgres \
     -d postgres \
     -c "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT NULL;"
```

## Verification
After applying the migration, the error should be resolved. You should be able to:
- Load `/api/users` endpoint
- Edit kurir staff daily targets in the admin panel
- Save daily_target values to the database

## Migration File Location
For future reference, the migration SQL is stored in:
`supabase/migrations/20260512000000_add_daily_target_to_profiles.sql`
