/*
  # Update orders table RLS policies

  1. Changes
    - Add more permissive RLS policies for orders table
    - Allow authenticated users to create orders
    - Allow golf courses to read their orders
    - Allow users to read their own orders

  2. Security
    - Maintain RLS enabled on orders table
    - Ensure proper access control for both golf courses and users
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Golf courses can read their orders" ON orders;

-- Create new policies
CREATE POLICY "Users can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (true);

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

CREATE POLICY "Users can read their own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM stripe_customers 
    WHERE customer_id = (
      SELECT customer_id 
      FROM stripe_orders 
      WHERE id::text = orders.id::text
    )
  )
);