/*
  # Add notifications system
  
  1. New Tables
    - notifications: Stores order notifications
      - id: UUID primary key
      - message: Notification text
      - read: Boolean flag for read status
      - created_at: Timestamp of creation
      - order_id: Reference to orders table
      
  2. Functions & Triggers
    - create_order_notification: Creates notifications for new orders
    - order_notification_trigger: Trigger to automate notification creation
    
  3. Security
    - Enable RLS
    - Add policies for employee access
*/

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  order_id UUID REFERENCES orders(id)
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
);

-- Create notification trigger function
CREATE OR REPLACE FUNCTION create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (message, order_id)
  VALUES (
    'New order #' || substring(NEW.id::text, 1, 8) || 
    ' on hole ' || COALESCE(NEW.hole_number::text, 'N/A') || 
    ': $' || NEW.total_price::text,
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