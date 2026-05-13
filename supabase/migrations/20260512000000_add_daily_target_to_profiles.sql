-- Add daily_target column to profiles table
ALTER TABLE profiles ADD COLUMN daily_target INTEGER DEFAULT NULL;

-- Create comment for documentation
COMMENT ON COLUMN profiles.daily_target IS 'Daily delivery target for kurir staff (number of deliveries)';
