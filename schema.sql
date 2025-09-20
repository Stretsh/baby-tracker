-- Baby Tracker Database Schema
-- PostgreSQL Database Setup

-- Create the feeding_records table
CREATE TABLE IF NOT EXISTS feeding_records (
  id SERIAL PRIMARY KEY,
  feeding_time TIMESTAMP WITH TIME ZONE NOT NULL,
  food_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feeding_records_time ON feeding_records(feeding_time DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_records_food_type ON feeding_records(food_type);

-- Grant permissions to the baby_tracker user
-- (Run this as the table owner or database superuser)
GRANT ALL PRIVILEGES ON TABLE feeding_records TO baby_tracker;
GRANT ALL PRIVILEGES ON SEQUENCE feeding_records_id_seq TO baby_tracker;

-- Insert some sample data for testing
INSERT INTO feeding_records (feeding_time, food_type, notes) VALUES
  (NOW() - INTERVAL '2 hours', 'Breast milk', 'Morning feeding'),
  (NOW() - INTERVAL '1 hour', 'Banana', 'First solid food'),
  (NOW() - INTERVAL '30 minutes', 'Breast milk', 'Afternoon feeding')
ON CONFLICT DO NOTHING;
