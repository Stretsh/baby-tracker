import { query } from '../../../utils/database'
import { DateTime } from 'luxon'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { feeding_time, food_type, notes } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
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

    // Update the feeding record
    const sql = `
      UPDATE feeding_records 
      SET feeding_time = $1, food_type = $2, notes = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, client_id, feeding_time, food_type, notes, created_at, updated_at
    `

    const result = await query(sql, [utcTime, food_type || '', notes || '', id])

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
