-- Create committee table
CREATE TABLE committee (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('President', 'Chairman', 'Secretary', 'Treasurer', 'Manager')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on position for faster lookup
CREATE INDEX committee_position_idx ON committee(position);

-- Enable Row Level Security (RLS)
ALTER TABLE committee ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access" 
ON committee FOR SELECT 
USING (true);

-- Allow authenticated users with admin role to insert, update, delete
CREATE POLICY "Allow authenticated users with admin role to modify" 
ON committee FOR ALL 
USING (auth.role() = 'authenticated' AND (((auth.jwt() -> 'user_metadata'::text) ->> 'isAdmin'::text) = 'true'::text));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_committee_updated_at
BEFORE UPDATE ON committee
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 