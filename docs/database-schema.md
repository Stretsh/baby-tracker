# Database Schema

## Overview

PostgreSQL is the **system of record** for multi-device sync. The browser keeps a **local copy** in IndexedDB (Dexie); the server stores one row per feeding with a stable **`client_id`** for idempotent sync.

## Tables

### `feeding_records`

Primary table storing individual feeding sessions.

**Logical shape** (after base schema + sync migration):

```sql
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  client_id UUID,
  feeding_time TIMESTAMP WITH TIME ZONE NOT NULL,
  food_type VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**

- **`id`**: Surrogate primary key (serial).
- **`client_id`**: Stable UUID generated on the client, unique per feeding, used as the sync key across devices. Added via migration; existing installs should run `scripts/add-client-id-migration.sql` and backfill as needed.
- **`feeding_time`**: When the feeding **happened** (user-facing time; may differ from when the row was written).
- **`food_type`**: What food was given; may be NULL for quick saves.
- **`notes`**: Optional notes.
- **`created_at`**: When the row was **inserted on the server** (default `NOW()` at insert). Not supplied by the client on sync.
- **`updated_at`**: Last **server-side** modification time; bumped with `NOW()` on updates. Used for **incremental pull** (`WHERE updated_at > lastSync`). Not supplied by the client on sync.

The repository’s root **`schema.sql`** creates the table without `client_id` for greenfield installs that only run that file; run **`scripts/add-client-id-migration.sql`** afterward so sync matches production expectations.

### `food_types` (optional / future)

Not used by the current app. Food suggestions are derived from **local** feeding history. A dedicated table could return later for categories or analytics.

```sql
CREATE TABLE food_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

Recommended indexes (see migration script and `schema.sql`):

```sql
CREATE INDEX idx_feeding_records_time ON feeding_records(feeding_time DESC);
CREATE INDEX idx_feeding_records_food_type ON feeding_records(food_type);
CREATE UNIQUE INDEX idx_feeding_records_client_id ON feeding_records(client_id);
CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);
CREATE INDEX idx_feeding_records_feeding_time ON feeding_records(feeding_time);
```

## Sample data

`schema.sql` may insert sample rows **without** `client_id`. For sync testing, prefer rows created through the app or insert explicit UUIDs.

```sql
INSERT INTO feeding_records (client_id, feeding_time, food_type, notes) VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '2026-01-15 08:30:00+00', 'Breast milk', 'Morning feeding'),
  ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '2026-01-15 12:15:00+00', 'Banana', 'First solid food');
```

## Future considerations

- **User management**: multiple children or caregivers
- **Feeding duration** / **amount**
- **Photos** and **growth** tracking
