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

    const lastSyncCutoff = lastSync ? new Date(lastSync) : null

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
          // Server owns created_at / updated_at (column defaults)
          const insertQuery = `
            INSERT INTO feeding_records (client_id, feeding_time, food_type, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING client_id, feeding_time, food_type, notes, updated_at
          `
          const result = await query(insertQuery, [
            client_id,
            payload.feeding_time,
            payload.food_type,
            payload.notes
          ])
          
          // Add to server records for client to update local
          serverRecords.push(result.rows[0])

        } else if (op === 'update') {
          const conflictCheckQuery = `
            SELECT updated_at FROM feeding_records 
            WHERE client_id = $1
          `
          const conflictResult = await query(conflictCheckQuery, [client_id])
          
          if (conflictResult.rows.length > 0) {
            const serverUpdatedAt = new Date(conflictResult.rows[0].updated_at)
            
            // Server changed since this device's last successful sync — stale client update
            if (lastSyncCutoff && serverUpdatedAt > lastSyncCutoff) {
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

          const updateQuery = `
            UPDATE feeding_records 
            SET feeding_time = $2, food_type = $3, notes = $4, updated_at = NOW()
            WHERE client_id = $1
            RETURNING client_id, feeding_time, food_type, notes, updated_at
          `
          const result = await query(updateQuery, [
            client_id,
            payload.feeding_time,
            payload.food_type,
            payload.notes
          ])
          
          if (result.rows.length > 0) {
            serverRecords.push(result.rows[0])
          }

        } else if (op === 'delete') {
          const conflictCheckQuery = `
            SELECT updated_at FROM feeding_records 
            WHERE client_id = $1
          `
          const conflictResult = await query(conflictCheckQuery, [client_id])
          
          if (conflictResult.rows.length > 0) {
            const serverUpdatedAt = new Date(conflictResult.rows[0].updated_at)
            
            if (lastSyncCutoff && serverUpdatedAt > lastSyncCutoff) {
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

    const nowResult = await query('SELECT NOW() AS server_now')
    const rawNow = nowResult.rows[0].server_now
    const serverNow =
      rawNow instanceof Date ? rawNow.toISOString() : String(rawNow)

    return {
      serverRecords,
      conflicts,
      success: true,
      serverNow
    }

  } catch (error) {
    console.error('Sync endpoint error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during sync'
    })
  }
})
