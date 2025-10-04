import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const { since } = queryParams

    // Validate since parameter
    if (!since) {
      throw createError({
        statusCode: 400,
        statusMessage: 'since parameter is required for sync'
      })
    }

    // Parse and validate the since timestamp
    let sinceDate: Date
    try {
      sinceDate = new Date(since as string)
      if (isNaN(sinceDate.getTime())) {
        throw new Error('Invalid date format')
      }
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid since timestamp format. Use ISO 8601 format.'
      })
    }

    // Get records updated since the given timestamp
    const sql = `
      SELECT id, client_id, feeding_time, food_type, notes, created_at, updated_at
      FROM feeding_records 
      WHERE updated_at > $1
      ORDER BY updated_at ASC
    `

    const result = await query(sql, [sinceDate.toISOString()])

    return {
      success: true,
      records: result.rows,
      count: result.rows.length,
      since: since,
      server_time: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error fetching sync data:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch sync data'
    })
  }
})
