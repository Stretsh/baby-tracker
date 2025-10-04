-- Migration script to add client_id column to feeding_records table
-- This script adds the client_id column and necessary indexes for offline-first sync

-- Add client_id column (nullable initially for existing records)
ALTER TABLE feeding_records 
ADD COLUMN client_id UUID;

-- Add unique index on client_id (after backfill, this will be NOT NULL)
CREATE UNIQUE INDEX idx_feeding_records_client_id ON feeding_records(client_id);

-- Add index on updated_at for sync operations
CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);

-- Add index on feeding_time for efficient queries
CREATE INDEX idx_feeding_records_feeding_time ON feeding_records(feeding_time);

-- Optional: Add constraint to make client_id NOT NULL after backfill
-- ALTER TABLE feeding_records ALTER COLUMN client_id SET NOT NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'feeding_records' 
  AND column_name = 'client_id';
