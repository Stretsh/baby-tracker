import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const { search = '', limit = '20' } = queryParams

    // Build the SQL query to get unique food types
    let sql = `
      SELECT DISTINCT food_type, COUNT(*) as usage_count
      FROM feeding_records
      WHERE food_type != ''
    `
    
    const params: any[] = []
    let paramCount = 0

    // Add search condition if provided
    if (search) {
      paramCount++
      sql += ` AND food_type ILIKE $${paramCount}`
      params.push(`%${search}%`)
    }

    // Add ordering and limit
    sql += ` GROUP BY food_type ORDER BY usage_count DESC, food_type ASC`
    
    paramCount++
    sql += ` LIMIT $${paramCount}`
    params.push(parseInt(limit as string))

    // Execute the query
    const result = await query(sql, params)

    // Extract just the food type names
    const food_types = result.rows.map(row => row.food_type)

    return {
      food_types
    }
  } catch (error) {
    console.error('Error fetching food types:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch food types'
    })
  }
})
