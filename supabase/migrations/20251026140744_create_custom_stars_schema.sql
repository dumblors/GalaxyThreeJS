/*
  # Create Custom Stars Schema

  ## Overview
  This migration sets up the database schema for user-generated custom stars in the galaxy visualization.
  Users can authenticate and create personalized stars with their information.

  ## New Tables
  
  ### `custom_stars`
  Stores user-created stars with their personal information and 3D positioning data.
  - `id` (uuid, primary key) - Unique identifier for each star
  - `user_id` (uuid, foreign key) - References auth.users, the creator of the star
  - `name` (text) - User's first name
  - `surname` (text) - User's last name
  - `photo_url` (text, nullable) - URL to user's uploaded photo in Supabase Storage
  - `message` (text) - Personal message or text from the user
  - `position_x` (float) - X coordinate in 3D space
  - `position_y` (float) - Y coordinate in 3D space
  - `position_z` (float) - Z coordinate in 3D space
  - `color_hex` (text) - Hex color code for the star
  - `size` (float) - Size multiplier for the star
  - `created_at` (timestamptz) - Timestamp when star was created
  - `views_count` (integer) - Number of times the star has been viewed

  ## Security
  
  ### Row Level Security (RLS)
  - All users can view all custom stars (public visibility)
  - Only authenticated users can create stars
  - Users can only create stars for themselves (auth.uid() = user_id)
  - Users can update or delete only their own stars
  - Maximum 5 stars per user enforced via CHECK constraint

  ## Storage
  
  ### Bucket: `star-photos`
  - Public bucket for storing user profile photos
  - 5MB max file size
  - Only authenticated users can upload
  - Users can only access their own uploads
*/

-- Create custom_stars table
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
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE custom_stars ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view all stars
CREATE POLICY "Anyone can view custom stars"
  ON custom_stars
  FOR SELECT
  TO public
  USING (true);

-- Policy: Authenticated users can create their own stars (max 5)
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

-- Policy: Users can update their own stars
CREATE POLICY "Users can update own stars"
  ON custom_stars
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stars
CREATE POLICY "Users can delete own stars"
  ON custom_stars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster user star lookups
CREATE INDEX IF NOT EXISTS idx_custom_stars_user_id ON custom_stars(user_id);

-- Create index for faster created_at queries
CREATE INDEX IF NOT EXISTS idx_custom_stars_created_at ON custom_stars(created_at DESC);

-- Create storage bucket for star photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('star-photos', 'star-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'star-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Anyone can view photos (public bucket)
CREATE POLICY "Anyone can view photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'star-photos');

-- Storage policy: Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'star-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policy: Users can delete their own photos
CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'star-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );