-- Add options column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS options TEXT[] DEFAULT '{}';

-- Add selected_options column to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS selected_options TEXT[] DEFAULT '{}';
