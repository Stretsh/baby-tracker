import { query } from '../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { lastSync, pendingOperations } = body

    // Validate request format
    if (!Array.isArray(pendingOperations)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'pendingOperations must be an array'
      })
    }

    const serverRecords = []
    const conflicts = []

    // PULL Phase: Fetch server records since lastSync
    if (lastSync) {
      const pullQuery = `
        SELECT client_id, feeding_time, food_type, notes, updated_at
        FROM feeding_records 
        WHERE updated_at > $1
        ORDER BY updated_at ASC
      `
      const pullResult = await query(pullQuery, [lastSync])
      serverRecords.push(...pullResult.rows)
    } else {
      // First sync - get all records
      const pullQuery = `
        SELECT client_id, feeding_time, food_type, notes, updated_at
        FROM feeding_records 
        ORDER BY updated_at ASC
      `
      const pullResult = await query(pullQuery)
      serverRecords.push(...pullResult.rows)
    }

    // PUSH Phase: Process pending operations
    for (const operation of pendingOperations) {
      const { operation: op, client_id, payload } = operation

      try {
        if (op === 'create') {
          // Insert new record
          const insertQuery = `
            INSERT INTO feeding_records (client_id, feeding_time, food_type, notes, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING client_id, feeding_time, food_type, notes, updated_at
          `
          const result = await query(insertQuery, [
            client_id,
            payload.feeding_time,
            payload.food_type,
            payload.notes,
            payload.updated_at
          ])
          
          // Add to server records for client to update local
          serverRecords.push(result.rows[0])

        } else if (op === 'update') {
          // Check for conflicts by comparing updated_at
          const conflictCheckQuery = `
            SELECT updated_at FROM feeding_records 
            WHERE client_id = $1
          `
          const conflictResult = await query(conflictCheckQuery, [client_id])
          
          if (conflictResult.rows.length > 0) {
            const serverUpdatedAt = new Date(conflictResult.rows[0].updated_at)
            const clientUpdatedAt = new Date(payload.updated_at)
            
            // If server was updated after client's last sync, it's a conflict
            if (serverUpdatedAt > clientUpdatedAt) {
              // Get current server record for conflict
              const serverRecordQuery = `
                SELECT client_id, feeding_time, food_type, notes, updated_at
                FROM feeding_records 
                WHERE client_id = $1
              `
              const serverRecordResult = await query(serverRecordQuery, [client_id])
              
              conflicts.push({
                client_id,
                local_data: payload,
                server_data: serverRecordResult.rows[0]
              })
              continue // Skip the update
            }
          }

          // No conflict - proceed with update
          const updateQuery = `
            UPDATE feeding_records 
            SET feeding_time = $2, food_type = $3, notes = $4, updated_at = $5
            WHERE client_id = $1
            RETURNING client_id, feeding_time, food_type, notes, updated_at
          `
          const result = await query(updateQuery, [
            client_id,
            payload.feeding_time,
            payload.food_type,
            payload.notes,
            payload.updated_at
          ])
          
          if (result.rows.length > 0) {
            serverRecords.push(result.rows[0])
          }

        } else if (op === 'delete') {
          // Check if record exists and handle conflicts
          const conflictCheckQuery = `
            SELECT updated_at FROM feeding_records 
            WHERE client_id = $1
          `
          const conflictResult = await query(conflictCheckQuery, [client_id])
          
          if (conflictResult.rows.length > 0) {
            const serverUpdatedAt = new Date(conflictResult.rows[0].updated_at)
            const clientUpdatedAt = new Date(payload.updated_at)
            
            // If server was updated after client's last sync, it's a conflict
            if (serverUpdatedAt > clientUpdatedAt) {
              // Get current server record for conflict
              const serverRecordQuery = `
                SELECT client_id, feeding_time, food_type, notes, updated_at
                FROM feeding_records 
                WHERE client_id = $1
              `
              const serverRecordResult = await query(serverRecordQuery, [client_id])
              
              conflicts.push({
                client_id,
                local_data: payload,
                server_data: serverRecordResult.rows[0]
              })
              continue // Skip the delete
            }
          }

          // No conflict - proceed with delete
          const deleteQuery = `
            DELETE FROM feeding_records 
            WHERE client_id = $1
            RETURNING client_id, feeding_time, food_type, notes, updated_at
          `
          await query(deleteQuery, [client_id])
        }

      } catch (error) {
        console.error(`Error processing ${op} operation for ${client_id}:`, error)
        // Continue processing other operations
      }
    }

    return {
      serverRecords,
      conflicts,
      success: true
    }

  } catch (error) {
    console.error('Sync endpoint error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during sync'
    })
  }
})
