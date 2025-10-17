// Baby Tracker Service Worker - Based on Danny's Basic Service Worker
// Version number for cache management
const SW_VERSION = 1;

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
  
  // Same schema as app
  db.version(1).stores({
    feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
    conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
    sync_queue: '++id, client_id, operation, payload, created_at, retry_count'
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
      return self.clients.claim();
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

// Sync queue monitoring (only when online and Dexie is loaded)
const checkSyncQueue = async () => {
  if (!navigator.onLine) {
    console.log('Service Worker: Offline - skipping sync check');
    return;
  }
  
  // Check if Dexie is available (loaded at top level when online)
  if (typeof Dexie === 'undefined') {
    console.log('Service Worker: Dexie not available, skipping sync');
    return;
  }
  
  try {
    const database = initDatabase();
    const pendingCount = await database.sync_queue.count();
    
    if (pendingCount > 0) {
      console.log(`Service Worker: Found ${pendingCount} pending sync operations`);
      
      // TODO: Implement actual sync logic in next step
      // For now, just log the pending operations
      const pendingOps = await database.sync_queue.toArray();
      console.log('Pending operations:', pendingOps);
    }
  } catch (error) {
    console.error('Service Worker: Error checking sync queue:', error);
  }
};

// Start monitoring sync queue every 5 seconds
setInterval(checkSyncQueue, 5000);

// Message handling for app communication
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_SYNC') {
    checkSyncQueue();
  }
});

console.log('Service Worker loaded with Dexie support');