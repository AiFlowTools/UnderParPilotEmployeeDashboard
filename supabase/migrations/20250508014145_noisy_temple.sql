/*
  # Enable RLS and add employee policy for orders table

  1. Changes
    - Enable Row Level Security on orders table
    - Add policy allowing employees to read all orders
    
  2. Security
    - Employees can view all orders through role-based access control
    - Policy checks user role in profiles table
*/

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for employees to read orders
CREATE POLICY "Allow employees to read orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles
    WHERE profiles.id = auth.uid() 
      AND profiles.role = 'employee'
  )
);