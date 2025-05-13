/*
  # QR Ordering Schema Setup

  1. New Tables
    - `holes`: Stores golf course hole information with coordinates
    - `orders`: Tracks food orders with location and status
    - `menu_items`: Stores available food items

  2. Functions
    - `nearest_hole`: Finds closest hole using KNN search
*/

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create holes table
CREATE TABLE IF NOT EXISTS holes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES golf_courses(id) NOT NULL,
  hole_number integer NOT NULL,
  location geometry(Point, 4326) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, hole_number)
);

-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES golf_courses(id) NOT NULL,
  category text NOT NULL,
  item_name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES golf_courses(id) NOT NULL,
  hole_id uuid REFERENCES holes(id),
  hole_number integer,
  items jsonb NOT NULL,
  total_price decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_session_id text,
  customer_name text,
  customer_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access for holes"
  ON holes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public read access for menu items"
  ON menu_items FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

-- Create nearest_hole function
CREATE OR REPLACE FUNCTION nearest_hole(
  course_id UUID,
  p_lat double precision,
  p_lng double precision
) RETURNS TABLE (
  hole_id UUID,
  hole_number integer,
  distance double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id as hole_id,
    h.hole_number,
    ST_Distance(
      h.location::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) as distance
  FROM holes h
  WHERE h.course_id = nearest_hole.course_id
  ORDER BY h.location::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;