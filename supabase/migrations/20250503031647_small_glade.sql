/*
  # Add hole_number to orders table

  1. Changes
    - Add hole_number column to orders table for GPS tracking
    - Add index for faster hole number lookups
    
  2. Notes
    - Maintains backwards compatibility with existing orders
    - hole_number can be null for legacy orders
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'hole_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN hole_number integer;
    
    -- Add an index for faster lookups
    CREATE INDEX idx_orders_hole_number ON orders(hole_number);
  END IF;
END $$;

-- Ensure RLS policies are up to date
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Update existing policies or create if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'Users can view their orders'
  ) THEN
    CREATE POLICY "Users can view their orders" 
    ON orders FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
END $$;