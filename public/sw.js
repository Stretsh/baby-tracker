// Baby Tracker Service Worker - Based on Danny's Basic Service Worker
// Version number for cache management
const SW_VERSION = 2;

// Service Worker version for cache management

// Load Dexie at top level when online to avoid event handler warnings
// This ensures Dexie's event handlers are registered during initial evaluation
if (navigator.onLine) {
  try {
    importScripts('https://unpkg.com/dexie@3.2.4/dist/dexie.min.js');
    console.log('Service Worker: Dexie loaded (online)');
  } catch (error) {
    console.error('Service Worker: Failed to load Dexie:', error);
  }
} else {
  console.log('Service Worker: Offline - Dexie not loaded');
}

// Dexie update checking removed - not needed for online-only loading

// Initialize Dexie database in Service Worker
let db = null;
const initDatabase = () => {
  if (db) return db;
  
  db = new Dexie('BabyTrackerDB');
  
  // Same schema as app + sync metadata
  db.version(1).stores({
    feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
    conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
    sync_queue: '++id, client_id, operation, payload, created_at, retry_count',
    sync_metadata: 'key, value'  // For storing last sync timestamp
  });
  
  return db;
};

// Cache name with version
const cacheName = `baby-tracker-cache-${SW_VERSION}`;

// Static files to cache
const staticFiles = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Routes to cache (SPA routes)
const routes = [
  '/',
  '/?tab=entry',
  '/?tab=history',
  '/?tab=settings'
];

// Install event - cache static files and routes
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(cacheName)
        .then((cache) => {
          console.log('Caching static files...');
          return cache.addAll(staticFiles);
        }),
      // Skip database initialization during install - will be done when online
      Promise.resolve()
        .then(() => {
          console.log('Service Worker: Database will be initialized when online');
        })
    ]).then(() => {
      console.log('Service Worker installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(`baby-tracker-cache-${SW_VERSION}`)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      // Claim clients before sync so postMessage targets exist
      return self.clients.claim().then(() => performFullSync());
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests for now (we'll handle these later)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        // For SPA routes, serve the main page
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        throw error;
      })
  );
});

// Check server reachability
const checkServerReachability = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch('/api/health', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Service Worker: Server unreachable:', error.message);
    return false;
  }
};

// Full sync (both PUSH and PULL phases)
const performFullSync = async () => {
  if (!navigator.onLine) {
    console.log('Service Worker: Offline - skipping full sync');
    await notifyApp('server-status', { reachable: false, online: false });
    return;
  }
  
  // Check server reachability
  const serverReachable = await checkServerReachability();
  if (!serverReachable) {
    console.log('Service Worker: Server unreachable - skipping sync');
    await notifyApp('server-status', { reachable: false, online: true });
    return;
  }
  
  // Check if Dexie is available (loaded at top level when online)
  if (typeof Dexie === 'undefined') {
    console.log('Service Worker: Dexie not available, skipping sync');
    return;
  }
  
  try {
    const database = await initDatabase();
    
    // Get pending operations for PUSH phase
    const pendingOps = await database.sync_queue.toArray();
    console.log(`Service Worker: Full sync - ${pendingOps.length} pending operations`);
    
    // Perform sync (handles both PUSH and PULL)
    await performSync(database, pendingOps);
    
    // Notify app that server is reachable and synced
    await notifyApp('server-status', { reachable: true, online: true });
    
  } catch (error) {
    console.error('Service Worker: Error during full sync:', error);
    await notifyApp('server-status', { reachable: false, online: true });
  }
};

// Sync queue monitoring and processing (only when online and Dexie is loaded)
const checkSyncQueue = async () => {
  if (!navigator.onLine) {
    console.log('Service Worker: Offline - skipping sync check');
    await notifyApp('server-status', { reachable: false, online: false });
    return;
  }
  
  // Check server reachability
  const serverReachable = await checkServerReachability();
  if (!serverReachable) {
    console.log('Service Worker: Server unreachable - skipping sync check');
    await notifyApp('server-status', { reachable: false, online: true });
    return;
  }
  
  // Check if Dexie is available (loaded at top level when online)
  if (typeof Dexie === 'undefined') {
    console.log('Service Worker: Dexie not available, skipping sync');
    return;
  }
  
  try {
    const database = await initDatabase();
    const pendingOps = await database.sync_queue.toArray();
    // Always run performSync (even with empty queue) so PULL runs on the timer
    if (pendingOps.length > 0) {
      console.log(`Service Worker: Found ${pendingOps.length} pending sync operations`);
      console.log('Pending operations:', pendingOps);
    } else {
      console.log('Service Worker: Periodic sync — queue empty, still pulling from server');
    }
    await performSync(database, pendingOps);
    
    // Notify app that server is reachable
    await notifyApp('server-status', { reachable: true, online: true });
    
  } catch (error) {
    console.error('Service Worker: Error checking sync queue:', error);
    await notifyApp('server-status', { reachable: false, online: true });
  }
};

// Push payload: only domain fields — created_at / updated_at are server-owned
const syncPayloadForOperation = (op) => {
  if (op.operation === 'delete') {
    return { client_id: op.client_id };
  }
  const p = op.payload || {};
  return {
    feeding_time: p.feeding_time,
    food_type: p.food_type ?? '',
    notes: p.notes ?? ''
  };
};

// Perform actual sync with server
const performSync = async (database, pendingOps) => {
  try {
    // Get last sync timestamp
    const lastSync = await getLastSyncTimestamp(database);
    
    // Prepare sync request
    const syncRequest = {
      lastSync,
      pendingOperations: pendingOps.map(op => ({
        operation: op.operation,
        client_id: op.client_id,
        payload: syncPayloadForOperation(op)
      }))
    };
    
    console.log('Service Worker: Sending sync request:', syncRequest);
    
    // POST to sync endpoint
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(syncRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }
    
    const syncResult = await response.json();
    console.log('Service Worker: Sync response:', syncResult);
    
    // Process server records (PULL phase)
    if (syncResult.serverRecords && syncResult.serverRecords.length > 0) {
      await processServerRecords(database, syncResult.serverRecords);
    }
    
    // Process conflicts
    if (syncResult.conflicts && syncResult.conflicts.length > 0) {
      await processConflicts(database, syncResult.conflicts);
    }
    
    // Remove successfully synced operations from queue
    const syncedClientIds = pendingOps.map(op => op.client_id);
    if (syncedClientIds.length > 0) {
      await database.sync_queue.where('client_id').anyOf(syncedClientIds).delete();
    }
    
    // Server clock watermark (same timeline as feeding_records.updated_at)
    const serverNow = syncResult.serverNow;
    if (typeof serverNow !== 'string' || !serverNow) {
      throw new Error('Sync response missing serverNow');
    }
    await updateLastSyncTimestamp(database, serverNow);
    
    console.log('Service Worker: Sync completed successfully');
    
    // Notify app about sync completion
    await notifyApp('sync-complete', {
      serverRecords: syncResult.serverRecords?.length || 0,
      conflicts: syncResult.conflicts?.length || 0
    });
    
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
    // TODO: Implement retry logic with exponential backoff
  }
};

// Get last sync timestamp from database
const getLastSyncTimestamp = async (database) => {
  try {
    const result = await database.sync_metadata.get('lastSync');
    return result ? result.value : null;
  } catch (error) {
    console.log('Service Worker: No last sync timestamp found');
    return null;
  }
};

// Update last sync timestamp
const updateLastSyncTimestamp = async (database, timestamp) => {
  try {
    await database.sync_metadata.put({
      key: 'lastSync',
      value: timestamp
    });
  } catch (error) {
    console.error('Service Worker: Failed to update last sync timestamp:', error);
  }
};

// Process server records (PULL phase)
const processServerRecords = async (database, serverRecords) => {
  for (const record of serverRecords) {
    try {
      // Check if record exists locally
      const existing = await database.feeding_records.where('client_id').equals(record.client_id).first();
      
      if (existing) {
        // Primary key is ++id — update by client_id index
        await database.feeding_records
          .where('client_id')
          .equals(record.client_id)
          .modify({
            feeding_time: record.feeding_time,
            food_type: record.food_type,
            notes: record.notes,
            updated_at: record.updated_at
          });
        console.log(`Service Worker: Updated record ${record.client_id}`);
      } else {
        // Insert new record
        await database.feeding_records.add({
          client_id: record.client_id,
          feeding_time: record.feeding_time,
          food_type: record.food_type,
          notes: record.notes,
          updated_at: record.updated_at
        });
        console.log(`Service Worker: Added new record ${record.client_id}`);
      }
    } catch (error) {
      console.error(`Service Worker: Failed to process server record ${record.client_id}:`, error);
    }
  }
};

// Process conflicts
const processConflicts = async (database, conflicts) => {
  for (const conflict of conflicts) {
    try {
      await database.conflicts.add({
        client_id: conflict.client_id,
        local_data: conflict.local_data,
        server_data: conflict.server_data,
        timestamp: new Date().toISOString(),
        resolved: false
      });
      console.log(`Service Worker: Added conflict for ${conflict.client_id}`);
    } catch (error) {
      console.error(`Service Worker: Failed to add conflict ${conflict.client_id}:`, error);
    }
  }
};

// Start monitoring sync queue every 60 seconds (conservative for baby tracker)
setInterval(checkSyncQueue, 60000);

// Background Sync API for reliable sync when app comes back online
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'baby-tracker-sync') {
    event.waitUntil(
      checkSyncQueue().catch(error => {
        console.error('Service Worker: Background sync failed:', error);
      })
    );
  }
});

// Background Sync registration is done from the page (useServiceWorkerSync.js); SW only handles the sync event.

// Handle online/offline events
self.addEventListener('online', () => {
  console.log('Service Worker: Connection restored - triggering sync');
  // Trigger sync when back online
  setTimeout(() => {
    checkSyncQueue();
  }, 1000); // Small delay to ensure connection is stable
});

self.addEventListener('offline', () => {
  console.log('Service Worker: Connection lost - sync paused');
});

// Notify app about sync events
const notifyApp = async (type, data) => {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    clients.forEach(client => {
      client.postMessage({
        type: type,
        data: data,
        timestamp: new Date().toISOString()
      });
    });
    console.log(`Service Worker: Notified ${clients.length} clients about ${type}`);
  } catch (error) {
    console.error('Service Worker: Failed to notify app:', error);
  }
};

// Debounced sync to prevent too many rapid syncs
let syncTimeout = null;
const debouncedSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    checkSyncQueue();
    syncTimeout = null;
  }, 2000); // 2 second debounce as per documentation
};

// Message handling for app communication
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_SYNC') {
    debouncedSync();
  }
  
  if (event.data && event.data.type === 'CHECK_SERVER') {
    performFullSync();
  }
});

console.log('Service Worker loaded with Dexie support');