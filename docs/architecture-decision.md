# Architecture Decision: Offline-First Implementation

**Date:** October 12, 2025  
**Last Updated:** October 17, 2025  
**Status:** Simplified Architecture - Service Worker Centric

## Summary

This document captures the architectural decisions made for transitioning the Baby Tracker app to a simplified offline-first PWA with Dexie + PostgreSQL sync, where the Service Worker handles all synchronization logic.

## Context

### Current Situation
- **Use Case**: Home network app for tracking baby feeding times
- **Users**: 2 (husband and wife)
- **Environment**: Server runs on home network, not publicly accessible
- **Primary Need**: Offline functionality when away from home network
- **Current State**: Phase 2 complete (Dexie CRUD works offline), but has too many server endpoints

### Problem Statement
The original implementation had:
- Multiple REST API endpoints (`server/api/feedings/*`)
- Unnecessary complexity for a simple 2-user home app
- Migration endpoints not needed for new architecture
- No sync engine (data doesn't sync between devices)

## Decision: Dexie + PostgreSQL with Single Sync Endpoint

### Why NOT Dexie Cloud?

We evaluated Dexie Cloud but decided against it for these reasons:

**Dexie Cloud Pros:**
- Zero backend code
- Built-in sync and conflict resolution
- Real-time sync
- Multi-user built-in

**Dexie Cloud Cons:**
- Vendor lock-in
- Data stored on external servers (not our control)
- Subscription cost ($8-15/month after free tier)
- Overkill for 2-user home network app

**Decision Rationale:**
For a home network app with 2 users and ~200 records, full control and simplicity outweigh the convenience of Dexie Cloud. We keep our data, avoid subscriptions, and learn valuable offline-first concepts by building our own sync.

### Why NOT Multiple API Endpoints?

Original approach had separate endpoints for each operation (GET, POST, PUT, DELETE), which is unnecessary complexity.

**Decision:** Consolidate to ONE sync endpoint that handles all operations via sync requests.

### Why NOT True Static Site?

**Challenge:** Cannot connect to PostgreSQL directly from browser (security).

**Options Evaluated:**
1. **Nuxt SPA with ONE endpoint** ✅ CHOSEN
   - Not "truly static" but works perfectly as PWA
   - Service worker caches app, sync endpoint only used when online
   - Simpler deployment (one process)

2. True Static + Separate Sync Service
   - Would require managing two separate services
   - Added complexity for no real benefit

3. True Static + No PostgreSQL
   - Manual sync between devices (not acceptable)

4. True Static + Dexie Cloud
   - Already decided against (see above)

**Decision:** Option 1 is the sweet spot - behaves like offline-first PWA while keeping architecture simple.

## Final Architecture: Service Worker Centric

### High-Level Overview

```
App Components → Dexie (always, regardless of online status)
                   ↓
         Service Worker (monitors sync_queue)
                   ↓
            /api/sync ↔ PostgreSQL
```

### Core Concept: Everything is Offline-First

**App never calls the server directly.** All operations go to Dexie. Service Worker handles sync in the background.

### Components

**App (Main Thread):**
- **Dexie (IndexedDB)**: Primary and only storage for app code
- **Components**: Read/write to Dexie directly, no network calls
- **Conflict Resolution UI**: 3-way resolution when conflicts detected
- **Sync Status Indicator**: Visual feedback from SW messages

**Service Worker:**
- **Dexie Instance**: Accesses same IndexedDB as app (separate instance, same database)
- **Background Sync**: Monitors sync_queue, syncs when online
- **Caching**: Handles offline asset caching
- **Sync Triggers**: App load, periodic checks, connection restore

**Server-Side:**
- **ONE Sync Endpoint** (`/api/sync.post.ts`): Handles all sync operations
- **PostgreSQL**: Secondary storage for multi-device sync
- **Health Endpoint**: Monitoring

### Key Principles

1. **Dexie is the ONLY data interface for app** - Components never call fetch/API
2. **Service Worker owns sync** - All sync logic lives in SW, not app
3. **True offline-first** - App works identically offline and online
4. **Separation of concerns** - App does CRUD, SW does sync
5. **Simple app code** - No sync composables, no network logic in components
6. **Background operation** - Sync happens automatically, transparently

### Why This Simplifies Everything

**Before (Complex):**
- Components need to know about online/offline state
- Composables manage sync triggers
- App code mixed with network logic
- Sync status tracked in multiple places

**After (Simple):**
- Components just use Dexie
- Service Worker handles everything network-related
- Clear boundary: App = data operations, SW = synchronization
- Single source of truth for sync state

## Sync Strategy

## Sync Triggers (from sync-strategy.md)
#
1. **App Load**: After Dexie database is ready → Two-way sync
2. **Local Changes**: User creates/updates/deletes → Debounced sync (2 seconds)
3. **Connection Restore**: Browser comes back online → Debounced sync (5 seconds)
4. **Periodic Sync**: Every 30 minutes → Sync if online and idle

### Two-Way Sync Flow

**PUSH Phase (Client → Server):**
- Send pending operations from sync_queue
- Server processes create/update/delete
- Server detects conflicts on update (timestamp comparison)
- Returns conflicts if detected

**PULL Phase (Server → Client):**
- Fetch records where `updated_at > lastSync`
- Compare with local records
- Update local if server is newer
- Create conflict if both changed

### Conflict Resolution (from sync-strategy.md)

**3 Options:**
1. **Keep Mine**: Push local version to server
2. **Keep Server**: Update local with server version
3. **Merge**: Show editable form with both versions, let user combine

**UI:** Side-by-side comparison showing time, type, and notes from both versions.

### Sync Status Indicator (from sync-strategy.md)

**Color-Coded Status:**
- 🟢 **Green**: Online + synced (no issues)
- 🟡 **Yellow**: Syncing in progress
- 🔴 **Red**: Offline (expected when away from home)
- 🔵 **Blue**: Conflicts detected

**Features:**
- 2px status bar directly below the header (green/yellow/red/blue)
- Conflicts button (red), same height as "Feed Now", with badge for count; opens conflict modal
- No manual sync; page refresh triggers sync (app load sync)

## Service Worker: Basic vs Workbox Decision

### Keep It Simple: Basic Service Worker ✅

**Decision:** Use a basic service worker (similar to Danny's pattern) rather than Workbox.

**Rationale for Basic SW:**
- Home network, 2 users only
- Simple caching needs (cache app, don't cache sync)
- Full control and understanding of what SW does
- ~100-150 lines vs Workbox complexity
- Easy to debug and modify
- No build step complications
- Fits "keep it simple" goal

**What Basic SW Needs:**
- Cache static assets for offline
- Load Dexie via importScripts
- Monitor sync_queue periodically
- POST to /api/sync when operations pending
- Handle Background Sync API for reliability
- Message app about sync status

**When to Reconsider Workbox:**
- If caching strategies become complex
- If deploying to public (millions of users)
- If need advanced features (precaching, complex routing)

**For now:** Basic SW is sufficient and more understandable.

## Dexie in Service Workers: Technical Details

### Confirmed: Dexie Works in Service Workers ✅

**Evidence:**
- Dexie official documentation confirms SW support
- Dexie Cloud uses SW with Dexie for synchronization
- Multiple production PWAs use this pattern
- IndexedDB is available in SW context (verified Web API)

### How It Works

**Both Contexts Access Same Database:**
- App creates Dexie instance pointing to 'BabyTrackerDB'
- SW creates separate Dexie instance pointing to same 'BabyTrackerDB'
- Both access the same IndexedDB database
- Changes in one context visible in the other

**Loading Dexie in Service Worker:**
- Use `importScripts('/path/to/dexie.min.js')` in SW
- Or bundle Dexie if using build process
- Same schema definition as app
- Separate instance, same underlying database

### Benefits of This Approach

**Compared to Raw IndexedDB in SW:**
- Same clean API in both contexts
- No verbose IndexedDB boilerplate in SW
- Easier to maintain (one data access pattern)
- Schema changes update in both places

**Compared to Messaging Pattern:**
- SW can independently check sync_queue
- No complex message passing for every data access
- SW can sync even when app is closed
- Simpler, more reliable architecture

### Trade-offs

**Pros:**
- Clean separation: App = CRUD, SW = Sync
- Simple app code (just use Dexie)
- Automatic background sync
- No network logic in components

**Cons:**
- Schema defined in two places (app + SW)
- Need to ensure Dexie loads in SW
- Both contexts need same Dexie version

**Verdict:** Pros outweigh cons for this use case.

## Implementation Plan: Service Worker Centric Approach

### Phase 1: Simplify Server API — COMPLETED
- [x] Delete all files in `server/api/feedings/*` and `server/api/food-types/*`
- [x] Keep `server/api/health.get.ts` and `server/utils/database.ts`
- [x] Create ONE sync endpoint: `server/api/sync.post.ts`
- [x] ~~Add `client_id` column to PostgreSQL with indexes~~ Already done.

### Phase 2: Implement Service Worker with Dexie
- Load Dexie in SW using importScripts (verified: Dexie works in SW)
- Create Dexie instance in SW with same schema as app
- Implement sync_queue monitoring
- Add Background Sync API integration
- Implement periodic sync checks
- Handle online/offline transitions
- POST pending operations to `/api/sync` endpoint

### Phase 3: Remove Sync Logic from App — COMPLETED
- [x] Remove/deprecate sync composables (`useSync`, `useAutoMigration`)
- [x] Components only interact with Dexie
- [x] No network calls from app code
- [x] Service Worker will handle all synchronization

### Phase 4: Service Worker Communication
- SW messages app about sync status
- App listens for sync events from SW
- Update sync status indicator from SW messages
- Handle conflict notifications from SW

### Phase 5: Conflict Resolution UI
- Create `app/components/ConflictModal.vue`
- Implement 3-way resolution (Mine/Server/Merge)
- Triggered by SW conflict notifications
- Resolution writes to Dexie, SW picks up and syncs

### Phase 6: Sync Status UI (Simplified)
- Create minimal `app/components/SyncStatus.vue`
- Displays status based on SW messages
- 2px status bar under header for status
- Red conflicts button with badge (opens conflict modal)
- No manual sync; page refresh already triggers sync

### Phase 7: Configure PWA
- Set `ssr: false` in `nuxt.config.ts`
- Ensure Dexie loads in both app and SW contexts
- Clean up unused server endpoints and composables

### Phase 8: Testing
- Test offline CRUD operations
- Test sync when returning to network
- Test conflict detection and resolution
- Test Background Sync API behavior
- Test multi-device scenarios

## Server Structure (Final)

```
server/
  api/
    sync.post.ts        ← ONE sync endpoint (all CRUD via sync)
    health.get.ts       ← Health monitoring
  utils/
    db.js              ← PostgreSQL connection helper
```

## Data Model

### PostgreSQL Schema

```sql
CREATE TABLE feeding_records (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL UNIQUE,        -- Primary sync key
  feeding_time TIMESTAMP WITH TIME ZONE,
  food_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feeding_records_client_id ON feeding_records(client_id);
CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);
```

### Dexie Schema

```javascript
db.version(1).stores({
  feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
  conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
  sync_queue: '++id, client_id, operation, payload, created_at, retry_count'
})
```

## Sync Protocol

### Request Format

```javascript
{
  lastSync: "2025-01-01T12:00:00.000Z",  // null for first sync
  pendingOperations: [
    {
      operation: "create|update|delete",
      client_id: "uuid-v4",
      payload: { feeding_time, food_type, notes }
    }
  ]
}
```

### Response Format

```javascript
{
  serverRecords: [
    // Records updated since lastSync
    { client_id, feeding_time, food_type, notes, updated_at }
  ],
  conflicts: [
    // Conflicts detected during push
    {
      client_id: "uuid-v4",
      local_data: {...},
      server_data: {...}
    }
  ],
  success: true
}
```

## Why This Architecture Works

### For Home Network Use
- App works offline when away from home ✅
- Syncs automatically when back on network ✅
- Simple one-process deployment ✅
- No external dependencies ✅

### For 2 Users
- PostgreSQL handles concurrent access ✅
- Conflict resolution for rare simultaneous edits ✅
- No complex access control needed ✅

### For Small Dataset (~200 records)
- Fast sync (entire dataset if needed) ✅
- No pagination complexity ✅
- Simple conflict detection (timestamp-based) ✅

### For Learning & Control
- Full control over data and logic ✅
- Understand how offline-first works ✅
- No vendor lock-in ✅
- Can migrate to Dexie Cloud later if desired ✅

## Migration Path

### If We Want Dexie Cloud Later

This architecture makes future migration to Dexie Cloud **easier**:
- Already using Dexie (just add cloud addon)
- Conflict resolution UI already built
- Offline-first patterns established
- Can switch if sync complexity becomes burdensome

### Current Approach Is Not Wasted

Building this teaches valuable concepts:
- Offline-first architecture
- Sync engine design
- Conflict resolution
- Service worker caching
- PWA best practices

## Success Criteria

- ✅ Both phones work offline
- ✅ Data syncs automatically on home network
- ✅ Conflicts resolve cleanly (3 options)
- ✅ Sync status visible and accurate
- ✅ No data loss ever
- ✅ Simple to understand and maintain
- ✅ Wife is happy with the app 😊

## Notes on Plan Document Format

The plan document should:
- Provide **guidance**, not complete implementation
- Avoid filling context with prescriptive code examples
- Give direction and key decisions
- Let the implementer (human or AI) determine exact code
- Reference existing documentation (sync-strategy.md) for details

## Related Documentation

- `docs/sync-strategy.md` - Detailed sync strategy and data models
- `docs/offline-first-roadmap.md` - Original roadmap (Phase 2 complete)
- `docs/dexie-schema-design.md` - Dexie schema details
- `docs/phase2-completion-summary.md` - What's already done

## Next Steps

**Architecture Finalized:** Service Worker centric approach with Dexie in both app and SW contexts.

**Implementation Ready:**
- Follow phase-by-phase plan above
- Start with Phase 1 (simplify server API)
- Key insight: App code becomes simpler, SW handles complexity
- Verified approach: Dexie works in Service Workers

**Key Architectural Shift:**
- FROM: Components manage sync with composables
- TO: Components just use Dexie, SW handles sync automatically
- Result: Simpler, cleaner, more maintainable code

