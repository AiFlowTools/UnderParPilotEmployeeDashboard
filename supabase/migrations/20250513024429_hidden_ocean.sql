/*
  # Add notifications table and trigger

  1. New Tables
    - notifications
      - id (uuid, primary key)
      - message (text)
      - read (boolean)
      - created_at (timestamptz)
      - order_id (uuid, foreign key to orders)

  2. Triggers
    - Create notification on new order
    
  3. Security
    - Enable RLS
    - Add policy for employees to read notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for employees to read notifications
CREATE POLICY "Employees can read notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'employee'
    )
  );

-- Create policy for employees to update notifications
CREATE POLICY "Employees can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'employee'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'employee'
    )
  );

-- Create function to generate notification message
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (message, order_id)
  VALUES (
    'New order on hole ' || NEW.hole_number || ': $' || NEW.total_price,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS order_notification_trigger ON orders;
CREATE TRIGGER order_notification_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION create_order_notification();