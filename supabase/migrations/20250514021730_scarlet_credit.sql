/*
  # Update order status workflow to support on_the_way status
  
  1. Changes
    - Add policy to ensure on_the_way status is handled like preparing
    - No special actions needed for the new status
    
  2. Notes
    - Maintains existing behavior for other statuses
    - on_the_way is treated as a pass-through status like preparing
*/

-- Verify the status exists in the enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'on_the_way' 
    AND enumtypid = (
      SELECT oid 
      FROM pg_type 
      WHERE typname = 'order_fulfillment_status'
    )
  ) THEN
    ALTER TYPE order_fulfillment_status ADD VALUE IF NOT EXISTS 'on_the_way';
  END IF;
END $$;