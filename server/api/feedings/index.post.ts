import { query } from '../../utils/database'
import { DateTime } from 'luxon'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { feeding_time, food_type, notes } = body

    // Validate required fields
    if (!feeding_time) {
      throw createError({
        statusCode: 400,
        statusMessage: 'feeding_time is required'
      })
    }

    // Convert local time to UTC for storage
    const utcTime = DateTime.fromISO(feeding_time).toUTC().toISO()

    // Generate client_id for offline-first sync
    const clientId = uuidv4()

    // Insert the new feeding record
    const sql = `
      INSERT INTO feeding_records (client_id, feeding_time, food_type, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, client_id, feeding_time, food_type, notes, created_at, updated_at
    `

    const result = await query(sql, [clientId, utcTime, food_type || '', notes || ''])

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create feeding record'
      })
    }

    return {
      success: true,
      message: 'Feeding saved successfully',
      feeding: result.rows[0]
    }
  } catch (error) {
    console.error('Error creating feeding:', error)
    
    if (error.statusCode) {
      return {
        success: false,
        message: error.statusMessage || 'Failed to save feeding'
      }
    }

    return {
      success: false,
      message: 'Failed to create feeding record'
    }
  }
})
