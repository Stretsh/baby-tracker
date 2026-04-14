# Dexie.js Schema Design

## Overview
This document defines the Dexie.js (IndexedDB) schema for the offline-first Baby Tracker implementation, based on the sync strategy outlined in `sync-strategy.md`.

## Database Schema

### Version 1: Simple Sync with client_id

```javascript
// Schema version 1: Simple sync with client_id
db.version(1).stores({
  feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
  conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
  sync_queue: '++id, client_id, operation, payload, created_at, retry_count'
})
```

## Table Definitions

### 1. feeding_records
**Purpose**: Store feeding records locally with sync metadata

**Fields**:
- `id` (auto-increment): Local database primary key
- `client_id` (string, indexed): UUID v4 - Primary sync key (never changes)
- `feeding_time` (string, indexed): UTC ISO timestamp
- `food_type` (string): Type of food (e.g., "Breast milk", "Formula")
- `notes` (string): Additional notes
- `updated_at` (string, indexed): UTC ISO timestamp for conflict detection

**Indexes**:
- `client_id`: Unique index for sync operations
- `feeding_time`: For date-based queries and sorting
- `updated_at`: For conflict detection and sync operations

**Data Format**:
```javascript
{
  id: 1,                                    // Auto-increment local ID
  client_id: "550e8400-e29b-41d4-a716-446655440000",  // UUID v4
  feeding_time: "2025-01-01T12:00:00.000Z", // UTC ISO
  food_type: "Breast milk",
  notes: "Full feeding",
  updated_at: "2025-01-01T12:00:00.000Z"   // UTC ISO
}
```

### 2. conflicts
**Purpose**: Store conflict data for user resolution

**Fields**:
- `id` (auto-increment): Local database primary key
- `client_id` (string, indexed): Which record has the conflict
- `local_data` (object): Current local version of the record
- `server_data` (object): Current server version of the record
- `timestamp` (string, indexed): When conflict was detected
- `resolved` (boolean, indexed): Whether conflict has been resolved

**Indexes**:
- `client_id`: For finding conflicts by record
- `timestamp`: For sorting conflicts by detection time
- `resolved`: For filtering unresolved conflicts

**Data Format**:
```javascript
{
  id: 1,
  client_id: "550e8400-e29b-41d4-a716-446655440000",
  local_data: {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    feeding_time: "2025-01-01T12:00:00.000Z",
    food_type: "Breast milk",
    notes: "Full feeding",
    updated_at: "2025-01-01T12:00:00.000Z"
  },
  server_data: {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    feeding_time: "2025-01-01T12:00:00.000Z",
    food_type: "Formula",
    notes: "Half feeding",
    updated_at: "2025-01-01T12:05:00.000Z"
  },
  timestamp: "2025-01-01T12:10:00.000Z",
  resolved: false
}
```

### 3. sync_queue
**Purpose**: Queue operations for background sync

**Fields**:
- `id` (auto-increment): Local database primary key
- `client_id` (string, indexed): Which record to sync
- `operation` (string, indexed): Type of operation (create, update, delete)
- `payload` (object): Data to send to server
- `created_at` (string, indexed): When operation was queued
- `retry_count` (number, indexed): Number of retry attempts

**Indexes**:
- `client_id`: For finding operations by record
- `operation`: For filtering by operation type
- `created_at`: For processing queue in order
- `retry_count`: For retry logic

**Data Format**:
```javascript
{
  id: 1,
  client_id: "550e8400-e29b-41d4-a716-446655440000",
  operation: "create",  // or "update", "delete"
  payload: {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    feeding_time: "2025-01-01T12:00:00.000Z",
    food_type: "Breast milk",
    notes: "Full feeding"
  },
  created_at: "2025-01-01T12:00:00.000Z",
  retry_count: 0
}
```

## Implementation Notes

### Index Design
- **Primary Keys**: All tables use auto-increment `id` for local operations
- **Sync Keys**: `client_id` is the primary sync identifier across all tables
- **Time Indexes**: `feeding_time` and `updated_at` for efficient time-based queries
- **Status Indexes**: `resolved` and `retry_count` for filtering and processing

### Data Relationships
- **One-to-One**: Each `feeding_record` can have at most one unresolved `conflict`
- **One-to-Many**: Each `feeding_record` can have multiple `sync_queue` entries (retries)
- **Sync Flow**: `feeding_records` → `sync_queue` → server → `conflicts` (if needed)

### Performance Considerations
- **Indexed Fields**: All frequently queried fields are indexed
- **Compound Queries**: Can efficiently query by `client_id` + `updated_at`
- **Batch Operations**: Can process `sync_queue` in batches
- **Cleanup**: Old resolved conflicts and successful sync operations can be cleaned up

### Migration Strategy
- **Version 1**: Initial schema with basic sync capabilities
- **Future Versions**: Can add new fields without breaking existing data
- **Data Migration**: Dexie handles version upgrades automatically
- **Backward Compatibility**: Old data remains accessible during upgrades

## Usage Examples

### Creating a New Record
```javascript
// 1. Create local record
const record = await db.feeding_records.add({
  client_id: generateUUID(),
  feeding_time: new Date().toISOString(),
  food_type: "Breast milk",
  notes: "Full feeding",
  updated_at: new Date().toISOString()
});

// 2. Queue for sync
await db.sync_queue.add({
  client_id: record.client_id,
  operation: "create",
  payload: record,
  created_at: new Date().toISOString(),
  retry_count: 0
});
```

### Handling Conflicts
```javascript
// 1. Detect conflict during sync
const conflict = await db.conflicts.add({
  client_id: "550e8400-e29b-41d4-a716-446655440000",
  local_data: localRecord,
  server_data: serverRecord,
  timestamp: new Date().toISOString(),
  resolved: false
});

// 2. User resolves conflict
await db.conflicts.update(conflict.id, { resolved: true });
await db.feeding_records.update(record.id, resolvedData);
```

### Processing Sync Queue
```javascript
// Get pending operations
const pendingOps = await db.sync_queue
  .where('retry_count')
  .below(3)
  .orderBy('created_at')
  .toArray();

// Process each operation
for (const op of pendingOps) {
  try {
    await syncToServer(op);
    await db.sync_queue.delete(op.id);
  } catch (error) {
    await db.sync_queue.update(op.id, { retry_count: op.retry_count + 1 });
  }
}
```

This schema provides a solid foundation for offline-first functionality while maintaining simplicity and performance.
