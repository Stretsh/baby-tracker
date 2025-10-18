#!/usr/bin/env node

/**
 * Test script for database migration
 * This script tests the migration endpoints to ensure they work correctly
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testMigration() {
  console.log('🧪 Testing Database Migration...\n')
  
  try {
    // Step 1: Check migration status
    console.log('1. Checking migration status...')
    const statusResponse = await fetch(`${BASE_URL}/api/feedings/migration-status`)
    const statusData = await statusResponse.json()
    
    console.log('   Status:', statusData.migration_status)
    console.log('   Total records:', statusData.total_records)
    console.log('   Migrated records:', statusData.migrated_records)
    console.log('   Remaining records:', statusData.remaining_records)
    console.log('   Progress:', statusData.progress_percentage + '%')
    
    // Step 2: Run migration if needed
    if (statusData.migration_status === 'not_started') {
      console.log('\n2. Running database migration...')
      const migrationResponse = await fetch(`${BASE_URL}/api/feedings/run-migration`, {
        method: 'POST'
      })
      const migrationData = await migrationResponse.json()
      
      if (migrationData.success) {
        console.log('   ✅ Migration completed successfully')
        console.log('   Column info:', migrationData.column_info)
      } else {
        console.log('   ❌ Migration failed:', migrationData.message)
        return
      }
    } else {
      console.log('\n2. Migration already exists, skipping...')
    }
    
    // Step 3: Check status again
    console.log('\n3. Checking migration status after migration...')
    const statusResponse2 = await fetch(`${BASE_URL}/api/feedings/migration-status`)
    const statusData2 = await statusResponse2.json()
    
    console.log('   Status:', statusData2.migration_status)
    console.log('   Total records:', statusData2.total_records)
    console.log('   Migrated records:', statusData2.migrated_records)
    console.log('   Remaining records:', statusData2.remaining_records)
    
    // Step 4: Run backfill if needed
    if (statusData2.remaining_records > 0) {
      console.log('\n4. Running client_id backfill...')
      const backfillResponse = await fetch(`${BASE_URL}/api/feedings/backfill-client-ids`, {
        method: 'POST'
      })
      const backfillData = await backfillResponse.json()
      
      if (backfillData.success) {
        console.log('   ✅ Backfill completed successfully')
        console.log('   Updated records:', backfillData.updated_count)
        console.log('   Remaining records:', backfillData.remaining_records)
        console.log('   Migration status:', backfillData.migration_status)
        
        if (backfillData.records && backfillData.records.length > 0) {
          console.log('   Sample records:')
          backfillData.records.slice(0, 3).forEach((record, index) => {
            console.log(`     ${index + 1}. ID: ${record.id}, Client ID: ${record.client_id}`)
          })
        }
      } else {
        console.log('   ❌ Backfill failed:', backfillData.message)
        return
      }
    } else {
      console.log('\n4. No records need backfill, skipping...')
    }
    
    // Step 5: Final status check
    console.log('\n5. Final migration status...')
    const finalStatusResponse = await fetch(`${BASE_URL}/api/feedings/migration-status`)
    const finalStatusData = await finalStatusResponse.json()
    
    console.log('   Status:', finalStatusData.migration_status)
    console.log('   Total records:', finalStatusData.total_records)
    console.log('   Migrated records:', finalStatusData.migrated_records)
    console.log('   Remaining records:', finalStatusData.remaining_records)
    console.log('   Progress:', finalStatusData.progress_percentage + '%')
    
    // Step 6: Test sync endpoint
    console.log('\n6. Testing sync endpoint...')
    const syncResponse = await fetch(`${BASE_URL}/api/feedings/sync?since=2020-01-01T00:00:00.000Z`)
    const syncData = await syncResponse.json()
    
    if (syncData.success) {
      console.log('   ✅ Sync endpoint working')
      console.log('   Records returned:', syncData.count)
      console.log('   Server time:', syncData.server_time)
    } else {
      console.log('   ❌ Sync endpoint failed:', syncData.message)
    }
    
    console.log('\n🎉 Migration test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testMigration()
