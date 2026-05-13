#!/bin/bash
set -e

# Load env
export SUPABASE_URL="https://nwcmmzouajxskkcvxmxl.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53Y21tem91YWp4c2trY3Z4bXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU3OTQ3NiwiZXhwIjoyMDkzMTU1NDc2fQ.bU9EeP2z_er8bxzynU9-QPaUwyW-hv43FWIpU4DObIU"

echo "Executing SQL migration to add daily_target column..."

# Use curl to execute SQL via Supabase edge function or direct query
curl -X POST \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_target INTEGER DEFAULT NULL;"
  }' 2>&1 || true

echo "Migration SQL file created at: supabase/migrations/20260512000000_add_daily_target_to_profiles.sql"
echo "To apply: use Supabase dashboard SQL editor or run with supabase db push"
