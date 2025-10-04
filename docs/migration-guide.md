# Database Migration Guide

## Overview
This guide covers the migration process for adding offline-first sync capabilities to the Baby Tracker application. The migration adds a `client_id` column to the `feeding_records` table and provides endpoints for data migration.

## Migration Endpoints

### 1. Check Migration Status
**GET** `/api/feedings/migration-status`

Returns the current migration status and statistics.

**Response:**
```json
{
  "success": true,
  "migration_status": "complete|in_progress|not_started|no_data",
  "total_records": 150,
  "migrated_records": 150,
  "remaining_records": 0,
  "progress_percentage": 100,
  "column_exists": true,
  "column_nullable": true
}
```

### 2. Run Database Migration
**POST** `/api/feedings/run-migration`

Adds the `client_id` column and necessary indexes to the database.

**Response:**
```json
{
  "success": true,
  "message": "Database migration completed successfully",
  "migration_status": "completed",
  "column_info": {
    "name": "client_id",
    "type": "uuid",
    "nullable": true,
    "default": null
  }
}
```

### 3. Backfill Client IDs
**POST** `/api/feedings/backfill-client-ids`

Generates and assigns `client_id` values to existing records.

**Response:**
```json
{
  "success": true,
  "message": "Successfully backfilled 150 records with client_id",
  "updated_count": 150,
  "remaining_records": 0,
  "migration_status": "complete",
  "records": [
    {
      "id": 1,
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "feeding_time": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

## Migration Process

### Step 1: Check Current Status
```bash
curl http://localhost:3000/api/feedings/migration-status
```

### Step 2: Run Database Migration (if needed)
```bash
curl -X POST http://localhost:3000/api/feedings/run-migration
```

### Step 3: Backfill Existing Data (if needed)
```bash
curl -X POST http://localhost:3000/api/feedings/backfill-client-ids
```

### Step 4: Verify Migration
```bash
curl http://localhost:3000/api/feedings/migration-status
```

## Automated Testing

Run the test script to verify the migration process:

```bash
node scripts/test-migration.js
```

The test script will:
1. Check migration status
2. Run migration if needed
3. Backfill data if needed
4. Verify final status
5. Test sync endpoint

## Database Schema Changes

### Before Migration
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

### After Migration
```sql
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  client_id UUID,                    -- NEW: For offline-first sync
  feeding_time TIMESTAMP WITH TIME ZONE NOT NULL,
  food_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEW INDEXES
CREATE UNIQUE INDEX idx_feeding_records_client_id ON feeding_records(client_id);
CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);
CREATE INDEX idx_feeding_records_feeding_time ON feeding_records(feeding_time);
```

## API Changes

### Updated Endpoints
All existing endpoints now include `client_id` in responses:

- `GET /api/feedings` - Returns `client_id` for each record
- `POST /api/feedings` - Generates and returns `client_id`
- `PUT /api/feedings/[id]` - Returns `client_id` in response

### New Endpoints
- `GET /api/feedings/sync?since=timestamp` - Incremental sync
- `PUT /api/feedings/[client_id]` - Update by client_id
- `DELETE /api/feedings/[client_id]` - Delete by client_id

## Migration Status Values

- **`not_started`**: `client_id` column doesn't exist
- **`in_progress`**: Column exists but some records lack `client_id`
- **`complete`**: All records have `client_id`
- **`no_data`**: No records in database
- **`already_exists`**: Migration already completed

## Safety Features

### Batch Processing
- Backfill processes records in batches of 100
- Prevents memory issues with large datasets
- Provides progress tracking

### Error Handling
- Validates column existence before operations
- Provides detailed error messages
- Supports rollback on migration failure

### Data Integrity
- Preserves all existing data
- Generates unique UUIDs for each record
- Maintains referential integrity

## Rollback (if needed)

If migration needs to be rolled back:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_feeding_records_client_id;
DROP INDEX IF EXISTS idx_feeding_records_updated_at;
DROP INDEX IF EXISTS idx_feeding_records_feeding_time;

-- Remove column
ALTER TABLE feeding_records DROP COLUMN client_id;
```

**⚠️ Warning**: Rollback will lose all `client_id` data and break offline-first functionality.

## Monitoring

### Check Migration Progress
```bash
# Get detailed status
curl http://localhost:3000/api/feedings/migration-status

# Check specific record
curl http://localhost:3000/api/feedings | jq '.feedings[0].client_id'
```

### Verify Sync Endpoint
```bash
# Test incremental sync
curl "http://localhost:3000/api/feedings/sync?since=2020-01-01T00:00:00.000Z"
```

## Troubleshooting

### Common Issues

1. **Column doesn't exist error**
   - Run the database migration first
   - Check if migration was successful

2. **Backfill fails**
   - Check database connection
   - Verify column exists
   - Check for duplicate client_ids

3. **Sync endpoint errors**
   - Verify timestamp format (ISO 8601)
   - Check database indexes exist

### Debug Commands

```bash
# Check database schema
psql -d baby_feeding -c "\d feeding_records"

# Check for null client_ids
psql -d baby_feeding -c "SELECT COUNT(*) FROM feeding_records WHERE client_id IS NULL;"

# Check indexes
psql -d baby_feeding -c "\di feeding_records"
```

## Next Steps

After successful migration:

1. **Update Client**: Deploy offline-first client application
2. **Test Sync**: Verify two-way sync works correctly
3. **Monitor**: Watch for sync conflicts and errors
4. **Optimize**: Monitor performance and adjust as needed

## Support

For issues with migration:
1. Check server logs for detailed error messages
2. Verify database permissions
3. Test with small dataset first
4. Contact development team if issues persist
