import { query } from '../../../utils/database'
import { DateTime } from 'luxon'

export default defineEventHandler(async (event) => {
  try {
    const clientId = getRouterParam(event, 'client_id')
    const body = await readBody(event)
    const { feeding_time, food_type, notes, updated_at } = body

    if (!clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'client_id is required'
      })
    }

    // Validate required fields
    if (!feeding_time) {
      throw createError({
        statusCode: 400,
        statusMessage: 'feeding_time is required'
      })
    }

    // Convert local time to UTC for storage
    const utcTime = DateTime.fromISO(feeding_time).toUTC().toISO()

    // Check for conflicts by comparing updated_at timestamps
    if (updated_at) {
      const conflictCheckSql = `
        SELECT updated_at 
        FROM feeding_records 
        WHERE client_id = $1
      `
      
      const conflictResult = await query(conflictCheckSql, [clientId])
      
      if (conflictResult.rows.length > 0) {
        const serverUpdatedAt = new Date(conflictResult.rows[0].updated_at)
        const clientUpdatedAt = new Date(updated_at)
        
        // If server record was updated after client's last known version, it's a conflict
        if (serverUpdatedAt > clientUpdatedAt) {
          return {
            success: false,
            conflict: true,
            message: 'Record was updated on server since last sync',
            server_record: {
              client_id: clientId,
              feeding_time: conflictResult.rows[0].feeding_time,
              food_type: conflictResult.rows[0].food_type,
              notes: conflictResult.rows[0].notes,
              updated_at: conflictResult.rows[0].updated_at
            }
          }
        }
      }
    }

    // Update the feeding record by client_id
    const sql = `
      UPDATE feeding_records 
      SET feeding_time = $1, food_type = $2, notes = $3, updated_at = NOW()
      WHERE client_id = $4
      RETURNING id, client_id, feeding_time, food_type, notes, created_at, updated_at
    `

    const result = await query(sql, [utcTime, food_type || '', notes || '', clientId])

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feeding record not found'
      })
    }

    return {
      success: true,
      message: 'Feeding updated successfully',
      feeding: result.rows[0]
    }

  } catch (error) {
    console.error('Error updating feeding:', error)
    
    if (error.statusCode) {
      return {
        success: false,
        message: error.statusMessage || 'Failed to update feeding'
      }
    }

    return {
      success: false,
      message: 'Failed to update feeding record'
    }
  }
})
