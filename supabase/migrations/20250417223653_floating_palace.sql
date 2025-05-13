/*
  # Fix orders table RLS policies

  1. Changes
    - Drop existing INSERT policy that was too permissive
    - Add new INSERT policy with proper conditions for order creation
    - Keep existing SELECT policies unchanged

  2. Security
    - Users can only create orders if they are authenticated
    - Orders are linked to the creating user through the stripe_customers table
*/

-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Create new INSERT policy with proper conditions
CREATE POLICY "Users can create orders with customer verification" 
ON orders
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stripe_customers
    WHERE stripe_customers.user_id = auth.uid()
    AND stripe_customers.deleted_at IS NULL
  )
);