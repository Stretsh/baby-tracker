/**
 * Auto-migration composable
 * Automatically checks and runs database migration without user interaction
 */

import { ref, onMounted } from 'vue'

const migrationStatus = ref({
  isChecking: false,
  isMigrating: false,
  isComplete: false,
  hasError: false,
  error: null,
  progress: 0,
  message: ''
})

const MIGRATION_CACHE_KEY = 'baby-tracker-migration-status'
const MIGRATION_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function useAutoMigration() {
  
  /**
   * Check if migration has been completed recently (cached)
   */
  function isMigrationRecentlyCompleted() {
    try {
      const cached = localStorage.getItem(MIGRATION_CACHE_KEY)
      if (!cached) return false
      
      const { status, timestamp } = JSON.parse(cached)
      const now = Date.now()
      
      // If migration was completed and cache is still valid
      return status === 'complete' && (now - timestamp) < MIGRATION_CACHE_DURATION
    } catch (error) {
      console.warn('Error reading migration cache:', error)
      return false
    }
  }
  
  /**
   * Cache migration status
   */
  function cacheMigrationStatus(status) {
    try {
      const cacheData = {
        status,
        timestamp: Date.now()
      }
      localStorage.setItem(MIGRATION_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Error caching migration status:', error)
    }
  }
  
  /**
   * Check migration status from server
   */
  async function checkMigrationStatus() {
    try {
      const response = await fetch('/api/feedings/migration-status')
      const data = await response.json()
      
      if (data.success) {
        return {
          needsMigration: data.migration_status !== 'complete',
          status: data.migration_status,
          progress: data.progress_percentage || 0,
          totalRecords: data.total_records || 0,
          migratedRecords: data.migrated_records || 0
        }
      }
      
      return { needsMigration: true, status: 'unknown', progress: 0 }
    } catch (error) {
      console.warn('Error checking migration status:', error)
      return { needsMigration: true, status: 'error', progress: 0 }
    }
  }
  
  /**
   * Run automatic migration
   */
  async function runAutoMigration() {
    migrationStatus.value.isMigrating = true
    migrationStatus.value.hasError = false
    migrationStatus.value.error = null
    
    try {
      console.log('🔄 Auto-migration: Starting...')
      migrationStatus.value.message = 'Checking database...'
      
      const response = await fetch('/api/feedings/auto-migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Auto-migration: Completed successfully')
        migrationStatus.value.isComplete = true
        migrationStatus.value.progress = data.progress_percentage || 100
        migrationStatus.value.message = `Migration complete: ${data.migrated_records}/${data.total_records} records migrated`
        
        // Cache the successful migration
        cacheMigrationStatus('complete')
        
        return true
      } else {
        throw new Error(data.message || 'Migration failed')
      }
      
    } catch (error) {
      console.error('❌ Auto-migration failed:', error)
      migrationStatus.value.hasError = true
      migrationStatus.value.error = error.message
      migrationStatus.value.message = `Migration failed: ${error.message}`
      
      return false
    } finally {
      migrationStatus.value.isMigrating = false
    }
  }
  
  /**
   * Initialize auto-migration on app startup
   */
  async function initializeAutoMigration() {
    // Skip if migration was recently completed
    if (isMigrationRecentlyCompleted()) {
      console.log('✅ Auto-migration: Recently completed, skipping')
      migrationStatus.value.isComplete = true
      migrationStatus.value.message = 'Migration already completed'
      return true
    }
    
    migrationStatus.value.isChecking = true
    migrationStatus.value.message = 'Checking migration status...'
    
    try {
      // Check current migration status
      const status = await checkMigrationStatus()
      
      if (!status.needsMigration) {
        console.log('✅ Auto-migration: No migration needed')
        migrationStatus.value.isComplete = true
        migrationStatus.value.message = 'Database is up to date'
        cacheMigrationStatus('complete')
        return true
      }
      
      console.log(`🔄 Auto-migration: Migration needed (${status.status})`)
      migrationStatus.value.message = `Migration needed: ${status.progress}% complete`
      
      // Run automatic migration
      const success = await runAutoMigration()
      
      if (success) {
        console.log('✅ Auto-migration: Successfully completed')
        return true
      } else {
        console.warn('⚠️ Auto-migration: Failed, but app can continue')
        return false
      }
      
    } catch (error) {
      console.error('❌ Auto-migration: Error during initialization', error)
      migrationStatus.value.hasError = true
      migrationStatus.value.error = error.message
      migrationStatus.value.message = `Migration error: ${error.message}`
      return false
    } finally {
      migrationStatus.value.isChecking = false
    }
  }
  
  /**
   * Clear migration cache (for testing or manual reset)
   */
  function clearMigrationCache() {
    try {
      localStorage.removeItem(MIGRATION_CACHE_KEY)
      console.log('🗑️ Auto-migration: Cache cleared')
    } catch (error) {
      console.warn('Error clearing migration cache:', error)
    }
  }
  
  /**
   * Get migration status for UI display
   */
  function getMigrationStatus() {
    return {
      isChecking: migrationStatus.value.isChecking,
      isMigrating: migrationStatus.value.isMigrating,
      isComplete: migrationStatus.value.isComplete,
      hasError: migrationStatus.value.hasError,
      error: migrationStatus.value.error,
      progress: migrationStatus.value.progress,
      message: migrationStatus.value.message
    }
  }
  
  return {
    migrationStatus: migrationStatus.value,
    initializeAutoMigration,
    runAutoMigration,
    checkMigrationStatus,
    clearMigrationCache,
    getMigrationStatus
  }
}
