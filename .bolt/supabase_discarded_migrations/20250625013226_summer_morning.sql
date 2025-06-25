/*
  # Add is_admin column to profiles table

  1. Schema Changes
    - Add is_admin boolean column to profiles table
    - Set default value to false
    - Update existing user nicpen98@gmail.com to have is_admin = true

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control for admin features
*/

-- Add is_admin column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set nicpen98@gmail.com as admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'nicpen98@gmail.com';

-- Also update any existing admin role users to have is_admin = true
UPDATE profiles 
SET is_admin = true 
WHERE role = 'admin';