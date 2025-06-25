/*
  # Add golf_course_id to profiles table for admin course assignment

  1. Changes
    - Add golf_course_id column to profiles table
    - Create foreign key relationship to golf_courses table
    - Update existing admin user with a golf course assignment
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper data relationships
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'golf_course_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN golf_course_id uuid REFERENCES golf_courses(id);
    
    -- Create index for faster lookups
    CREATE INDEX idx_profiles_golf_course_id ON profiles(golf_course_id);
  END IF;
END $$;

-- Update the admin user to have a golf course assignment
UPDATE profiles 
SET golf_course_id = 'c4a48f69-a535-4f57-8716-d34cff63059b'
WHERE email = 'nicpen98@gmail.com' AND is_admin = true;