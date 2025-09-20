# Database Schema

## Overview

The app uses PostgreSQL to store feeding records and food types. The schema is designed to be simple yet flexible for future enhancements.

## Tables

### `feeding_records`

Primary table storing individual feeding sessions.

```sql
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  feeding_time TIMESTAMP WITH TIME ZONE NOT NULL,
  food_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Auto-incrementing primary key
- `feeding_time`: When the feeding occurred (can be past or current time)
- `food_type`: What food was given (e.g., "Breast milk", "Banana", "Rice cereal") - can be NULL for quick saves
- `notes`: Optional additional notes about the feeding
- `created_at`: When the record was created in the system
- `updated_at`: When the record was last modified

### `food_types` (Optional Enhancement)

For future use - could store food categories, nutritional info, etc.

```sql
CREATE TABLE food_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100), -- e.g., "milk", "solid", "snack"
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

```sql
-- For efficient history queries
CREATE INDEX idx_feeding_records_time ON feeding_records(feeding_time DESC);

-- For food type lookups
CREATE INDEX idx_feeding_records_food_type ON feeding_records(food_type);
```

## Sample Data

```sql
INSERT INTO feeding_records (feeding_time, food_type, notes) VALUES
  ('2024-01-15 08:30:00', 'Breast milk', 'Morning feeding'),
  ('2024-01-15 12:15:00', 'Banana', 'First solid food'),
  ('2024-01-15 15:45:00', 'Breast milk', 'Afternoon feeding'),
  ('2024-01-15 19:00:00', 'Rice cereal', 'Evening meal');
```

## Future Considerations

- **User Management**: If multiple children are tracked
- **Feeding Duration**: Track how long feeding lasted
- **Amount**: Track quantity consumed
- **Photos**: Store feeding photos
- **Growth Tracking**: Link to weight/height measurements
