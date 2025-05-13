/*
  # Add user_id column and RLS policies for orders table

  1. Schema Changes
    - Add user_id column to golf_courses table to track ownership
  
  2. Security Changes
    - Add policy to allow authenticated users to insert orders
    - Add policy to allow golf courses to read their orders
*/

-- Add user_id column to golf_courses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'golf_courses' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE golf_courses ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Policy for inserting orders
CREATE POLICY "Users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for golf courses to read their orders
CREATE POLICY "Golf courses can read their orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM golf_courses 
    WHERE golf_courses.id = orders.course_id
    AND golf_courses.user_id = auth.uid()
  )
);