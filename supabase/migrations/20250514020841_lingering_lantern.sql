/*
  # Remove SMS functionality
  
  1. Changes
    - Drop any triggers that reference customer_phone
    - Ensure existing notification triggers remain intact
    
  2. Notes
    - No schema changes needed since customer_phone column doesn't exist
    - Preserves existing notification system
*/

-- Verify and keep the existing order notification trigger
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'order_notification_trigger'
  ) THEN
    CREATE TRIGGER order_notification_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_notification();
  END IF;
END $$;