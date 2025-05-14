/*
  # Update order fulfillment status type
  
  1. Changes
    - Add 'on_the_way' to order_fulfillment_status enum type
    - Ensure backward compatibility with existing data
    
  2. Notes
    - Using ALTER TYPE to add new enum value
    - Safer than converting to text since we want to maintain data integrity
*/

ALTER TYPE order_fulfillment_status ADD VALUE IF NOT EXISTS 'on_the_way';