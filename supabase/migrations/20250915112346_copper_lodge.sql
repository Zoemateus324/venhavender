/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new policies that don't reference the users table within users policies
    - Use auth.jwt() claims for admin role checking instead of querying users table

  2. Policy Changes
    - Users can read their own profile using auth.uid() = id
    - Users can update their own profile using auth.uid() = id
    - Admin access will be handled through JWT claims or separate admin functions
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies without recursion
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: Admin access should be handled through service role or JWT claims
-- For now, we'll handle admin operations through the application layer