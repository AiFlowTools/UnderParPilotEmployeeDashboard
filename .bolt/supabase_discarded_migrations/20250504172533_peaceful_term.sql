/*
  # Add item notes to parsed orders view
  
  1. Changes
    - Update parsed_orders_advanced view to include item notes
    - Maintain backwards compatibility with existing orders
*/

CREATE OR REPLACE VIEW public.parsed_orders_advanced AS
SELECT
  o.id AS order_id,
  o.course_id,
  o.notes,
  o.total_price,
  o.status,
  o.created_at,
  o.customer_name,
  o.customer_email,
  o.hole_number,
  string_agg(
    item ->> 'item_name' || 
    CASE 
      WHEN item ->> 'note' IS NOT NULL AND item ->> 'note' != '' 
      THEN ' (Note: ' || item ->> 'note' || ')'
      ELSE ''
    END,
    ', '
  ) AS ordered_items
FROM orders o,
     jsonb_array_elements(o.items) AS item
GROUP BY
  o.id,
  o.course_id,
  o.notes,
  o.total_price,
  o.status,
  o.created_at,
  o.customer_name,
  o.customer_email,
  o.hole_number;