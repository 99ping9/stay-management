-- Add staff_members column to rooms table (JSONB array to store [{name, phone}, ...])
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS staff_members JSONB DEFAULT '[]';

-- Add recipient_type column to message_templates table
ALTER TABLE message_templates ADD COLUMN IF NOT EXISTS recipient_type TEXT DEFAULT 'guest' CHECK (recipient_type IN ('guest', 'staff'));
