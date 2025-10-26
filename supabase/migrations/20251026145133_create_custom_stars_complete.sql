/*
  # Create Custom Stars Schema - Complete Setup

  ## Overview
  This migration sets up the complete database schema for user-generated custom stars 
  in the galaxy visualization with proper security and storage.

  ## New Tables
  
  ### `custom_stars`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - Creator reference
  - `name` (text) - User's first name
  - `surname` (text) - User's last name
  - `photo_url` (text, nullable) - Photo URL
  - `message` (text) - Personal message
  - `position_x` (float) - X coordinate in 3D
  - `position_y` (float) - Y coordinate in 3D
  - `position_z` (float) - Z coordinate in 3D
  - `color_hex` (text) - Hex color code
  - `size` (float) - Size multiplier
  - `brightness` (float) - Brightness level for highlighting
  - `created_at` (timestamptz) - Creation timestamp
  - `views_count` (integer) - View counter

  ## Security
  - RLS enabled on all tables
  - Public read access to stars
  - Users can only create/edit their own stars
  - Max 5 stars per user
*/

CREATE TABLE IF NOT EXISTS custom_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  photo_url text,
  message text NOT NULL,
  position_x float NOT NULL,
  position_y float NOT NULL,
  position_z float NOT NULL,
  color_hex text NOT NULL DEFAULT '#ffffff',
  size float NOT NULL DEFAULT 1.0,
  brightness float NOT NULL DEFAULT 1.0,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE custom_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom stars"
  ON custom_stars
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create own stars"
  ON custom_stars
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (
      SELECT COUNT(*) 
      FROM custom_stars 
      WHERE user_id = auth.uid()
    ) < 5
  );

CREATE POLICY "Users can update own stars"
  ON custom_stars
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stars"
  ON custom_stars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_custom_stars_user_id ON custom_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_stars_created_at ON custom_stars(created_at DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('star-photos', 'star-photos', true)
ON CONFLICT (id) DO NOTHING;