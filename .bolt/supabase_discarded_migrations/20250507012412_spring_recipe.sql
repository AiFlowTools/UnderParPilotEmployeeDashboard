/*
  # Add profiles table with role-based access control

  1. New Tables
    - profiles: Stores user roles and additional information
      - id: References auth.users
      - role: User role (customer, employee, admin)
      - created_at: Timestamp of creation
      - updated_at: Last update timestamp

  2. Security
    - Enable RLS
    - Add policies for role-based access
*/

CREATE TYPE user_role AS ENUM ('customer', 'employee', 'admin');

CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a test employee account
INSERT INTO profiles (id, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'employee'
);