import { query } from '../../utils/database'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (_event) => {
  try {
    // Step 1: Check if client_id column exists
    const checkColumnSql = `
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'feeding_records' 
        AND column_name = 'client_id'
    `
    
    const columnCheck = await query(checkColumnSql, [])
    
    // Step 2: Run database migration if column doesn't exist
    if (columnCheck.rows.length === 0) {
      console.log('🔧 Auto-migration: Adding client_id column...')
      
      const migrationSql = `
        BEGIN;
        
        -- Add client_id column (nullable initially for existing records)
        ALTER TABLE feeding_records 
        ADD COLUMN client_id UUID;
        
        -- Add unique index on client_id
        CREATE UNIQUE INDEX idx_feeding_records_client_id ON feeding_records(client_id);
        
        -- Add index on updated_at for sync operations
        CREATE INDEX idx_feeding_records_updated_at ON feeding_records(updated_at);
        
        -- Add index on feeding_time for efficient queries
        CREATE INDEX idx_feeding_records_feeding_time ON feeding_records(feeding_time);
        
        COMMIT;
      `
      
      await query(migrationSql, [])
      console.log('✅ Auto-migration: Database schema updated')
    }
    
    // Step 3: Check if any records need client_id backfill
    const countSql = `
      SELECT COUNT(*) as count
      FROM feeding_records 
      WHERE client_id IS NULL
    `
    
    const countResult = await query(countSql, [])
    const recordsNeedingBackfill = parseInt(countResult.rows[0].count)
    
    // Step 4: Backfill client_ids if needed
    if (recordsNeedingBackfill > 0) {
      console.log(`🔧 Auto-migration: Backfilling ${recordsNeedingBackfill} records with client_id...`)
      
      // Process in batches to avoid memory issues
      const batchSize = 100
      let offset = 0
      let totalUpdated = 0
      
      while (offset < recordsNeedingBackfill) {
        const getRecordsSql = `
          SELECT id, feeding_time, food_type, notes, created_at, updated_at
          FROM feeding_records 
          WHERE client_id IS NULL
          ORDER BY created_at ASC
          LIMIT $1 OFFSET $2
        `
        
        const records = await query(getRecordsSql, [batchSize, offset])
        
        if (records.rows.length === 0) {
          break
        }
        
        // Generate client_id for each record and update
        const updatePromises = records.rows.map(async (record: any) => {
          const clientId = uuidv4()
          
          const updateSql = `
            UPDATE feeding_records 
            SET client_id = $1, updated_at = NOW()
            WHERE id = $2
          `
          
          await query(updateSql, [clientId, record.id])
          
          return {
            id: record.id,
            client_id: clientId
          }
        })
        
        await Promise.all(updatePromises)
        totalUpdated += records.rows.length
        offset += batchSize
      }
      
      console.log(`✅ Auto-migration: Backfilled ${totalUpdated} records`)
    }
    
    // Step 5: Verify final status
    const finalCountSql = `
      SELECT COUNT(*) as count
      FROM feeding_records 
      WHERE client_id IS NULL
    `
    
    const finalResult = await query(finalCountSql, [])
    const remainingRecords = parseInt(finalResult.rows[0].count)
    
    // Step 6: Get total record count
    const totalCountSql = 'SELECT COUNT(*) as count FROM feeding_records'
    const totalResult = await query(totalCountSql, [])
    const totalRecords = parseInt(totalResult.rows[0].count)
    
    const migratedRecords = totalRecords - remainingRecords
    
    return {
      success: true,
      message: 'Auto-migration completed successfully',
      migration_status: remainingRecords === 0 ? 'complete' : 'partial',
      total_records: totalRecords,
      migrated_records: migratedRecords,
      remaining_records: remainingRecords,
      progress_percentage: totalRecords > 0 ? Math.round((migratedRecords / totalRecords) * 100) : 0,
      auto_migrated: true
    }
    
  } catch (error: any) {
    console.error('❌ Auto-migration failed:', error)
    
    // Try to rollback if possible
    try {
      await query('ROLLBACK;', [])
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError)
    }
    
    return {
      success: false,
      message: 'Auto-migration failed',
      error: error.message,
      auto_migrated: false
    }
  }
})
