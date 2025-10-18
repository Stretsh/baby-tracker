import { query } from '../../utils/database'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (_event) => {
  try {
    // Check if client_id column exists
    const checkColumnSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'feeding_records' 
        AND column_name = 'client_id'
    `
    
    const columnCheck = await query(checkColumnSql, [])
    
    if (columnCheck.rows.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'client_id column does not exist. Run migration first.'
      })
    }
    
    // Get count of records that need backfill
    const countSql = `
      SELECT COUNT(*) as count
      FROM feeding_records 
      WHERE client_id IS NULL
    `
    
    const countResult = await query(countSql, [])
    const totalRecords = parseInt(countResult.rows[0].count)
    
    if (totalRecords === 0) {
      return {
        success: true,
        message: 'No records need client_id backfill',
        updated_count: 0,
        migration_status: 'complete'
      }
    }
    
    // Get all records that don't have a client_id (in batches for large datasets)
    const batchSize = 100
    let offset = 0
    let totalUpdated = 0
    const updatedRecords = []
    
    while (offset < totalRecords) {
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
        // Generate proper UUID v4
        const clientId = uuidv4()
        
        const updateSql = `
          UPDATE feeding_records 
          SET client_id = $1, updated_at = NOW()
          WHERE id = $2
        `
        
        await query(updateSql, [clientId, record.id])
        
        return {
          id: record.id,
          client_id: clientId,
          feeding_time: record.feeding_time
        }
      })
      
      const batchResults = await Promise.all(updatePromises)
      updatedRecords.push(...batchResults)
      totalUpdated += batchResults.length
      
      offset += batchSize
    }
    
    // Verify migration is complete
    const verifySql = `
      SELECT COUNT(*) as count
      FROM feeding_records 
      WHERE client_id IS NULL
    `
    
    const verifyResult = await query(verifySql, [])
    const remainingRecords = parseInt(verifyResult.rows[0].count)
    
    return {
      success: true,
      message: `Successfully backfilled ${totalUpdated} records with client_id`,
      updated_count: totalUpdated,
      remaining_records: remainingRecords,
      migration_status: remainingRecords === 0 ? 'complete' : 'partial',
      records: updatedRecords.slice(0, 10) // Return first 10 for preview
    }
    
  } catch (error: any) {
    console.error('Error backfilling client_ids:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to backfill client_ids'
    })
  }
})
