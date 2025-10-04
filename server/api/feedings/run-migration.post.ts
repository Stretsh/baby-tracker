import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Check if client_id column already exists
    const checkColumnSql = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'feeding_records' 
        AND column_name = 'client_id'
    `
    
    const columnCheck = await query(checkColumnSql, [])
    
    if (columnCheck.rows.length > 0) {
      return {
        success: true,
        message: 'client_id column already exists',
        migration_status: 'already_exists'
      }
    }
    
    // Run the migration in a transaction
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
    
    // Verify the migration
    const verifySql = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'feeding_records' 
        AND column_name = 'client_id'
    `
    
    const verifyResult = await query(verifySql, [])
    
    if (verifyResult.rows.length === 0) {
      throw new Error('Migration failed - client_id column not found after migration')
    }
    
    const columnInfo = verifyResult.rows[0]
    
    return {
      success: true,
      message: 'Database migration completed successfully',
      migration_status: 'completed',
      column_info: {
        name: columnInfo.column_name,
        type: columnInfo.data_type,
        nullable: columnInfo.is_nullable === 'YES',
        default: columnInfo.column_default
      }
    }
    
  } catch (error) {
    console.error('Error running migration:', error)
    
    // Try to rollback if possible
    try {
      await query('ROLLBACK;', [])
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to run database migration'
    })
  }
})
