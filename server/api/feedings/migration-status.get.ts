import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Check if client_id column exists
    const checkColumnSql = `
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'feeding_records' 
        AND column_name = 'client_id'
    `
    
    const columnCheck = await query(checkColumnSql, [])
    
    if (columnCheck.rows.length === 0) {
      return {
        success: true,
        migration_status: 'not_started',
        message: 'client_id column does not exist. Migration not started.',
        total_records: 0,
        migrated_records: 0,
        remaining_records: 0
      }
    }
    
    // Get total record count
    const totalCountSql = 'SELECT COUNT(*) as count FROM feeding_records'
    const totalResult = await query(totalCountSql, [])
    const totalRecords = parseInt(totalResult.rows[0].count)
    
    // Get count of records with client_id
    const migratedCountSql = `
      SELECT COUNT(*) as count 
      FROM feeding_records 
      WHERE client_id IS NOT NULL
    `
    const migratedResult = await query(migratedCountSql, [])
    const migratedRecords = parseInt(migratedResult.rows[0].count)
    
    // Get count of records without client_id
    const remainingCountSql = `
      SELECT COUNT(*) as count 
      FROM feeding_records 
      WHERE client_id IS NULL
    `
    const remainingResult = await query(remainingCountSql, [])
    const remainingRecords = parseInt(remainingResult.rows[0].count)
    
    // Determine migration status
    let migrationStatus = 'in_progress'
    if (totalRecords === 0) {
      migrationStatus = 'no_data'
    } else if (remainingRecords === 0) {
      migrationStatus = 'complete'
    } else if (migratedRecords === 0) {
      migrationStatus = 'not_started'
    }
    
    return {
      success: true,
      migration_status: migrationStatus,
      total_records: totalRecords,
      migrated_records: migratedRecords,
      remaining_records: remainingRecords,
      progress_percentage: totalRecords > 0 ? Math.round((migratedRecords / totalRecords) * 100) : 0,
      column_exists: true,
      column_nullable: columnCheck.rows[0].is_nullable === 'YES'
    }
    
  } catch (error) {
    console.error('Error checking migration status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check migration status'
    })
  }
})
