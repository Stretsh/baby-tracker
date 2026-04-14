import Dexie from 'dexie'
import { v4 as uuidv4 } from 'uuid'

// Database instance
let db = null

// Initialize Dexie database
const initDatabase = () => {
  if (db) return db
  
  db = new Dexie('BabyTrackerDB')
  
  db.version(1).stores({
    feeding_records: '++id, client_id, feeding_time, food_type, notes, updated_at',
    conflicts: '++id, client_id, local_data, server_data, timestamp, resolved',
    sync_queue: '++id, client_id, operation, payload, created_at, retry_count',
    sync_metadata: 'key, value'  // For storing last sync timestamp
  })
  
  return db
}

// Get current UTC timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString()
}

export const useOfflineData = () => {
  const database = initDatabase()
  
  // Initialize database on first use
  onMounted(async () => {
    try {
      await database.open()
      console.log('Dexie database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Dexie database:', error)
    }
  })
  
  // Feeding Records CRUD Operations
  
  const createFeedingRecord = async (data) => {
    try {
      const record = {
        client_id: uuidv4(),
        feeding_time: data.feeding_time || getCurrentTimestamp(),
        food_type: data.food_type || '',
        notes: data.notes || '',
        updated_at: getCurrentTimestamp()
      }
      
      const id = await database.feeding_records.add(record)
      
      // Queue for sync
      await database.sync_queue.add({
        client_id: record.client_id,
        operation: 'create',
        payload: record,
        created_at: getCurrentTimestamp(),
        retry_count: 0
      })
      
      // Trigger immediate sync if online
      if (navigator.onLine && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          registration.active?.postMessage({ type: 'CHECK_SYNC' })
        } catch (error) {
          console.log('Failed to trigger sync:', error)
        }
      }
      
      return { id, ...record }
    } catch (error) {
      console.error('Failed to create feeding record:', error)
      throw error
    }
  }
  
  const getFeedingRecords = async (options = {}) => {
    try {
      let query = database.feeding_records.orderBy('feeding_time')
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      if (options.offset) {
        query = query.offset(options.offset)
      }
      
      if (options.since) {
        query = query.filter(record => record.updated_at > options.since)
      }
      
      const records = await query.reverse().toArray()
      return records
    } catch (error) {
      console.error('Failed to get feeding records:', error)
      throw error
    }
  }
  
  const getFeedingRecord = async (clientId) => {
    try {
      const record = await database.feeding_records
        .where('client_id')
        .equals(clientId)
        .first()
      
      return record
    } catch (error) {
      console.error('Failed to get feeding record:', error)
      throw error
    }
  }
  
  const updateFeedingRecord = async (clientId, data) => {
    try {
      const existingRecord = await getFeedingRecord(clientId)
      if (!existingRecord) {
        throw new Error('Record not found')
      }
      
      const updatedRecord = {
        ...existingRecord,
        ...data,
        updated_at: getCurrentTimestamp()
      }
      
      await database.feeding_records
        .where('client_id')
        .equals(clientId)
        .modify(updatedRecord)
      
      // Queue for sync
      await database.sync_queue.add({
        client_id: clientId,
        operation: 'update',
        payload: updatedRecord,
        created_at: getCurrentTimestamp(),
        retry_count: 0
      })
      
      // Trigger immediate sync if online
      if (navigator.onLine && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          registration.active?.postMessage({ type: 'CHECK_SYNC' })
        } catch (error) {
          console.log('Failed to trigger sync:', error)
        }
      }
      
      return updatedRecord
    } catch (error) {
      console.error('Failed to update feeding record:', error)
      throw error
    }
  }
  
  const deleteFeedingRecord = async (clientId) => {
    try {
      const existingRecord = await getFeedingRecord(clientId)
      if (!existingRecord) {
        throw new Error('Record not found')
      }
      
      await database.feeding_records
        .where('client_id')
        .equals(clientId)
        .delete()
      
      // Queue for sync
      await database.sync_queue.add({
        client_id: clientId,
        operation: 'delete',
        payload: { client_id: clientId },
        created_at: getCurrentTimestamp(),
        retry_count: 0
      })
      
      // Trigger immediate sync if online
      if (navigator.onLine && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          registration.active?.postMessage({ type: 'CHECK_SYNC' })
        } catch (error) {
          console.log('Failed to trigger sync:', error)
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to delete feeding record:', error)
      throw error
    }
  }
  
  // Data Validation
  
  const validateFeedingRecord = (data) => {
    const errors = []
    
    if (!data.feeding_time) {
      errors.push('Feeding time is required')
    } else {
      const date = new Date(data.feeding_time)
      if (isNaN(date.getTime())) {
        errors.push('Invalid feeding time format')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  // Utility Functions
  
  const clearAllData = async () => {
    try {
      await database.feeding_records.clear()
      await database.conflicts.clear()
      await database.sync_queue.clear()
      return true
    } catch (error) {
      console.error('Failed to clear all data:', error)
      throw error
    }
  }
  
  const getDatabaseStats = async () => {
    try {
      // Get all conflicts and filter by resolved status
      const allConflicts = await database.conflicts.toArray()
      const unresolvedConflicts = allConflicts.filter(conflict => !conflict.resolved)
      
      const [feedingCount, queueCount] = await Promise.all([
        database.feeding_records.count(),
        database.sync_queue.count()
      ])
      
      const conflictCount = unresolvedConflicts.length
      
      return {
        feedingRecords: feedingCount,
        unresolvedConflicts: conflictCount,
        queuedOperations: queueCount
      }
    } catch (error) {
      console.error('Failed to get database stats:', error)
      throw error
    }
  }
  
  return {
    // Database instance
    database,
    
    // Feeding Records CRUD
    createFeedingRecord,
    getFeedingRecords,
    getFeedingRecord,
    updateFeedingRecord,
    deleteFeedingRecord,
    
    // Data Validation
    validateFeedingRecord,
    
    // Utility Functions
    clearAllData,
    getDatabaseStats
  }
}
