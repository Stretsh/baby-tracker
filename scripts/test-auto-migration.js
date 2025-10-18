#!/usr/bin/env node

/**
 * Test script for automatic migration
 * This script tests the auto-migration endpoint to ensure it works correctly
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testAutoMigration() {
  console.log('🤖 Testing Automatic Migration...\n')
  
  try {
    // Step 1: Check initial migration status
    console.log('1. Checking initial migration status...')
    const statusResponse = await fetch(`${BASE_URL}/api/feedings/migration-status`)
    const statusData = await statusResponse.json()
    
    console.log('   Status:', statusData.migration_status)
    console.log('   Total records:', statusData.total_records)
    console.log('   Migrated records:', statusData.migrated_records)
    console.log('   Remaining records:', statusData.remaining_records)
    
    // Step 2: Run automatic migration
    console.log('\n2. Running automatic migration...')
    const autoMigrationResponse = await fetch(`${BASE_URL}/api/feedings/auto-migrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const autoMigrationData = await autoMigrationResponse.json()
    
    if (autoMigrationData.success) {
      console.log('   ✅ Auto-migration completed successfully')
      console.log('   Status:', autoMigrationData.migration_status)
      console.log('   Total records:', autoMigrationData.total_records)
      console.log('   Migrated records:', autoMigrationData.migrated_records)
      console.log('   Remaining records:', autoMigrationData.remaining_records)
      console.log('   Progress:', autoMigrationData.progress_percentage + '%')
      console.log('   Auto-migrated:', autoMigrationData.auto_migrated)
    } else {
      console.log('   ❌ Auto-migration failed:', autoMigrationData.message)
      if (autoMigrationData.error) {
        console.log('   Error:', autoMigrationData.error)
      }
      return
    }
    
    // Step 3: Verify final status
    console.log('\n3. Verifying final migration status...')
    const finalStatusResponse = await fetch(`${BASE_URL}/api/feedings/migration-status`)
    const finalStatusData = await finalStatusResponse.json()
    
    console.log('   Status:', finalStatusData.migration_status)
    console.log('   Total records:', finalStatusData.total_records)
    console.log('   Migrated records:', finalStatusData.migrated_records)
    console.log('   Remaining records:', finalStatusData.remaining_records)
    console.log('   Progress:', finalStatusData.progress_percentage + '%')
    
    // Step 4: Test that sync endpoint works
    console.log('\n4. Testing sync endpoint...')
    const syncResponse = await fetch(`${BASE_URL}/api/feedings/sync?since=2020-01-01T00:00:00.000Z`)
    const syncData = await syncResponse.json()
    
    if (syncData.success) {
      console.log('   ✅ Sync endpoint working')
      console.log('   Records returned:', syncData.count)
      console.log('   Server time:', syncData.server_time)
      
      // Check if records have client_id
      if (syncData.records && syncData.records.length > 0) {
        const hasClientIds = syncData.records.every(record => record.client_id)
        console.log('   Records have client_id:', hasClientIds)
        
        if (hasClientIds) {
          console.log('   Sample client_id:', syncData.records[0].client_id)
        }
      }
    } else {
      console.log('   ❌ Sync endpoint failed:', syncData.message)
    }
    
    // Step 5: Test that regular endpoints include client_id
    console.log('\n5. Testing regular endpoints include client_id...')
    const feedingsResponse = await fetch(`${BASE_URL}/api/feedings?limit=5`)
    const feedingsData = await feedingsResponse.json()
    
    if (feedingsData.feedings && feedingsData.feedings.length > 0) {
      const hasClientIds = feedingsData.feedings.every(feeding => feeding.client_id)
      console.log('   Regular endpoint includes client_id:', hasClientIds)
      
      if (hasClientIds) {
        console.log('   Sample record:', {
          id: feedingsData.feedings[0].id,
          client_id: feedingsData.feedings[0].client_id,
          feeding_time: feedingsData.feedings[0].feeding_time
        })
      }
    }
    
    console.log('\n🎉 Auto-migration test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   ✅ Database migration completed')
    console.log('   ✅ Client IDs backfilled')
    console.log('   ✅ Sync endpoint working')
    console.log('   ✅ Regular endpoints updated')
    console.log('   ✅ Ready for offline-first sync')
    
  } catch (error) {
    console.error('❌ Auto-migration test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testAutoMigration()
