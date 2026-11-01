-- Create nyra_chats table
CREATE TABLE IF NOT EXISTS nyra_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE nyra_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chats"
  ON nyra_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
  ON nyra_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS nyra_chats_user_id_idx ON nyra_chats(user_id);
CREATE INDEX IF NOT EXISTS nyra_chats_timestamp_idx ON nyra_chats(timestamp);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nyra_chats_updated_at
  BEFORE UPDATE ON nyra_chats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 