import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const { limit = '8' } = queryParams

    // Get recently used food types (most frequently used in the last 30 days)
    const sql = `
      SELECT food_type, COUNT(*) as usage_count
      FROM feeding_records
      WHERE food_type != ''
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY food_type
      ORDER BY usage_count DESC, MAX(created_at) DESC
      LIMIT $1
    `

    const result = await query(sql, [parseInt(limit as string)])

    // Extract just the food type names
    const recent_foods = result.rows.map(row => row.food_type)

    return {
      recent_foods
    }
  } catch (error) {
    console.error('Error fetching recent food types:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recent food types'
    })
  }
})
