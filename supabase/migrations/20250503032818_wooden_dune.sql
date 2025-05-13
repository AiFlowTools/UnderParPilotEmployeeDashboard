/*
  # Add notes field to orders table
  
  1. Changes
    - Add notes TEXT column to orders table
    - Add index for faster text search
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
    
    -- Add an index for faster text search
    CREATE INDEX idx_orders_notes ON orders USING gin(to_tsvector('english', notes));
  END IF;
END $$;