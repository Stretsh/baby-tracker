# API Design

## Overview

The server exposes a small JSON API used by the **service worker** for background synchronization and reachability checks. The Nuxt app itself does **not** call per-record REST endpoints for normal feeding CRUD: that work happens in **IndexedDB (Dexie)** on the client, and changes are queued for the worker to push.

Older documentation described many REST routes (`/api/feedings`, `/api/food-types`, …). Those routes are **not** part of the current app; food suggestions and history come from **local** data.

## Base URL

- Development: `http://localhost:3300/api`
- Production: same origin as your deployed app (e.g. `https://your-host/api`)

## Authentication

For local network use, no authentication is required. Future versions could add simple password protection.

## Endpoints

### Health

#### GET `/api/health`

Lightweight check that the server and database are reachable.

**Response (success):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "database": "connected"
}
```

**Errors:** `500` if the database query fails.

Used by the service worker to distinguish “browser online” from “app backend actually reachable.”

---

### Sync

#### POST `/api/sync`

Single endpoint for **incremental pull** and **push** of queued operations. The service worker sends the device’s last successful sync watermark (`lastSync`, an ISO timestamp from the **previous** response’s `serverNow`) and an array of pending operations built from the local sync queue.

**Request body:**
```json
{
  "lastSync": "2026-01-15T11:59:00.000Z",
  "pendingOperations": [
    {
      "operation": "create",
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "payload": {
        "feeding_time": "2026-01-15T11:30:00.000Z",
        "food_type": "Breast milk",
        "notes": ""
      }
    },
    {
      "operation": "update",
      "client_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "payload": {
        "feeding_time": "2026-01-15T11:35:00.000Z",
        "food_type": "Banana",
        "notes": "Snack"
      }
    },
    {
      "operation": "delete",
      "client_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      "payload": {
        "client_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8"
      }
    }
  ]
}
```

- **`lastSync`**: `null` or omitted on first sync for that device’s stored cursor; afterwards, the value returned as **`serverNow`** from the last successful sync.
- **`payload`** for `create` / `update` contains only **domain fields** (`feeding_time`, `food_type`, `notes`). **`created_at`** and **`updated_at`** are set by the server.

**Processing order (conceptually):**

1. **Pull:** rows in `feeding_records` with `updated_at` **greater than** `lastSync` (if `lastSync` is set); otherwise all rows.
2. **Push:** apply each pending operation (insert / update / delete) with server-owned timestamps and optional conflict handling (see server implementation).

**Response:**
```json
{
  "serverRecords": [
    {
      "client_id": "550e8400-e29b-41d4-a716-446655440000",
      "feeding_time": "2026-01-15T11:30:00.000Z",
      "food_type": "Breast milk",
      "notes": "",
      "updated_at": "2026-01-15T12:00:01.234Z"
    }
  ],
  "conflicts": [],
  "success": true,
  "serverNow": "2026-01-15T12:00:02.500Z"
}
```

- **`serverRecords`**: rows to merge into the client (including echoes of successful pushes and changes from other devices).
- **`conflicts`**: reserved for concurrent-edit handling; shape is implementation-defined.
- **`serverNow`**: server clock at end of the request; the client **must** persist this as **`lastSync`** for the next incremental pull so cursors stay on the **server** timeline.

---

## Error Handling

Failed requests use Nuxt / Nitro error responses (e.g. `400` for invalid body, `500` on server errors). The sync handler validates that `pendingOperations` is an array.

## Data validation (domain)

- **`feeding_time`**: required for creates; ISO 8601 timestamp (interpreted with time zone where applicable).
- **`food_type`** / **`notes`**: strings; may be empty.

Validation details may also be enforced in the client composables before queueing.

## Rate limiting

For local network use, no rate limiting is implemented. Future versions could add basic rate limiting.

## CORS

Same-origin deployment is assumed for the PWA and service worker. Broader CORS would be a deployment concern if you split origins.

## Database connection

Server routes use the shared `pg`-based helper in `server/utils/database.ts` with pooling and error handling.

## Example: sync from the service worker

The worker builds the body from IndexedDB (`sync_metadata.lastSync`, `sync_queue`), `POST`s to `/api/sync`, applies `serverRecords` to Dexie, clears processed queue entries, and stores **`serverNow`** back into `sync_metadata`.

## Future enhancements

- **Bulk operations**: import/export of feeding data through sync or separate tools
- **Statistics**: aggregates on the server or client
- **Notifications**: feeding reminders
- **Backup**: scheduled database backups (see deployment guide)
