# Offline-First Sync Strategy

## Core Principles

### Identity Model
- **Primary Key**: Use stable `client_id` (UUID) generated at record creation time
- **Never Changes**: `client_id` remains constant even when `feeding_time` is edited
- **Server Storage**: Server persists `client_id` and returns it in all responses
- **Why Not feeding_time**: Time edits would create new records or match wrong records

### Clean Record Design
- **No Sync Metadata**: `feeding_records` contains only business data
- **No Fields**: `sync_status`, `last_synced`, `server_id` - none of these
- **Pure Data**: `client_id`, `feeding_time` (UTC), `food_type`, `notes`, `updated_at` (UTC)

### Timestamp-Based Conflict Detection
- **Simple Logic**: Compare `updated_at` timestamps between local and server
- **Last-Write-Wins**: Most recent timestamp wins by default
- **User Override**: Show conflicts in modal for manual resolution

## Data Model

### feeding_records (Dexie + Server)
```javascript
{
  client_id: "uuid-v4",           // Primary sync key
  feeding_time: "2025-01-01T12:00:00.000Z",  // UTC ISO
  food_type: "Breast milk",
  notes: "Full feeding",
  updated_at: "2025-01-01T12:00:00.000Z"     // UTC ISO
}
```

### conflicts (Dexie only)
```javascript
{
  client_id: "uuid-v4",           // Which record has conflict
  local_data: {...},              // Current local version
  server_data: {...},             // Current server version
  timestamp: "2025-01-01T12:00:00.000Z",
  resolved: false                 // 0/1 for IndexedDB
}
```

### sync_queue (Dexie only)
```javascript
{
  client_id: "uuid-v4",           // Which record to sync
  operation: "create|update|delete",
  payload: {...},                 // Data to send
  last_known_version: 5,          // For conflict detection
  idempotency_key: "uuid-v4",     // Prevent duplicate operations
  created_at: "2025-01-01T12:00:00.000Z",
  retry_count: 0
}
```

## Sync Triggers

### 1. App Load
- **When**: After Dexie database is ready
- **Action**: Run two-way sync (pull then push)
- **Purpose**: Ensure local data is current

### 2. Local Changes
- **When**: User creates/updates/deletes a record
- **Action**: Add to sync queue, trigger immediate two-way sync
- **Purpose**: Keep changes in sync

### 3. Connection Restore
- **When**: Browser comes back online (edge-triggered)
- **Action**: Debounced two-way sync (5 second cooldown)
- **Purpose**: Sync offline changes

### 4. Periodic Sync
- **When**: Every 30 minutes (configurable)
- **Action**: Two-way sync if online and idle
- **Purpose**: Catch missed changes

## Two-Way Sync Flow

### Pull Phase (Server → Client)
1. **Fetch Changes**: Get server records since last sync timestamp
2. **For Each Server Record**:
   - Find local record by `client_id`
   - If not found: Add new record to Dexie
   - If found: Compare timestamps/versions
     - Both changed: Create conflict, preserve local changes
     - Only server changed: Update local record
     - Only local changed: Keep local record
     - Neither changed: No action

### Push Phase (Client → Server)
1. **Process Queue**: Send queued operations to server
2. **For Each Operation**:
   - Send with current `updated_at`
   - If 200: Update local record with server response
   - If 409: Create conflict, keep in queue
   - If other error: Retry later with backoff

### Conflict Resolution
1. **User Choice**: Keep Mine, Keep Other, or Merge
2. **Merge Logic**: Show both versions side by side for user to choose:
   ```
   My version:
   time: [time]
   type: [type] 
   notes: [notes]
   ---
   Server version:
   time: [time]
   type: [type]
   notes: [notes]
   ```
3. **Resolution**: Update local record, remove conflict, retry push

## Conflict Detection Details

### Pull Conflicts
- **Trigger**: Both local and server records changed since last successful sync
- **Detection**: Compare `updated_at` timestamps
- **Action**: Create conflict entry, preserve local changes
- **User Impact**: Red conflict button appears

### Push Conflicts
- **Trigger**: Server record changed since client's last sync
- **Detection**: Server returns 409 Conflict response
- **Action**: Create conflict entry, keep operation in queue
- **User Impact**: Red conflict button appears

## Legacy Migration Strategy

### One-Time Backfill
1. **Server Endpoint**: `/api/feedings/backfill-client-ids`
2. **Process**: 
   - Generate `client_id` for records missing it
   - Match by exact `feeding_time` (UTC) during backfill
   - Preserve all existing data
3. **Client**: Call backfill endpoint on first sync after upgrade

### Migration Safety
- **Backward Compatible**: Existing records work during transition
- **Gradual**: New records use `client_id`, old records get backfilled
- **Data Preservation**: All existing feeding data is preserved
- **Reversible**: Can rollback if issues arise

## Key Implementation Rules

### Time Handling
- **Storage**: All times as UTC ISO strings
- **Display**: Convert to local timezone for UI
- **Comparison**: Always compare UTC times
- **Normalization**: Convert server times to UTC before storage

### Deduplication
- **Upsert Only**: Never create duplicate records
- **Key**: Always upsert by `client_id`
- **Conflicts**: One unresolved conflict per `client_id`

### Error Handling
- **Network Errors**: Queue operations for retry
- **Server Errors**: Exponential backoff
- **User Errors**: Show conflict resolution modal
- **Data Errors**: Log and continue, don't crash

### Performance
- **Batching**: Process queue in small batches
- **Debouncing**: Prevent rapid sync triggers
- **Cooldowns**: Avoid sync loops

## Database Schema

### Server Database (PostgreSQL)
```sql
-- Current table (before migration)
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  feeding_time TIMESTAMP WITH TIME ZONE,
  food_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration to add sync fields
ALTER TABLE feeding_records 
ADD COLUMN client_id UUID;

-- Add indexes for performance
CREATE INDEX idx_feeding_records_client_id ON feeding_records(client_id);
CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);

-- Final table structure
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,        -- Primary sync key
  feeding_time TIMESTAMP WITH TIME ZONE,
  food_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Client Database (Dexie/IndexedDB)
```javascript
// Schema version 1: Simple sync with client_id
db.version(1).stores({
  feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
  conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
  sync_queue: '++id, client_id, operation, payload, created_at, retry_count'
})
```

## API Endpoints

### Server Endpoints
- `GET /api/feedings?since=timestamp` - Fetch changes since timestamp
- `POST /api/feedings` - Create new record
- `PUT /api/feedings/:client_id` - Update record by client_id
- `DELETE /api/feedings/:client_id` - Delete record by client_id
- `POST /api/feedings/backfill-client-ids` - One-time backfill for existing data

### Request/Response Format
```javascript
// Create/Update Request
{
  client_id: "uuid-v4",
  feeding_time: "2025-01-01T12:00:00.000Z",
  food_type: "Breast milk",
  notes: "Full feeding"
}

// Response (Success)
{
  success: true,
  record: {...}
}

// Response (Conflict)
{
  success: false,
  conflict: true,
  server_record: {...}
}
```
