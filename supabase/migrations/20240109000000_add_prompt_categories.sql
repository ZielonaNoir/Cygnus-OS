-- Create prompt_categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('domain', 'scenario')),
  parent_id uuid REFERENCES prompt_categories(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Ensure unique name per type/parent/user
  UNIQUE(name, type, parent_id, owner_id)
);

-- RLS Policies
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
  ON prompt_categories FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own categories"
  ON prompt_categories FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own categories"
  ON prompt_categories FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own categories"
  ON prompt_categories FOR DELETE
  USING (auth.uid() = owner_id);
