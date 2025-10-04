import { query } from '../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const { sort = 'desc', limit = '50', offset = '0', search = '' } = queryParams

    // Build the SQL query
    let sql = `
      SELECT id, client_id, feeding_time, food_type, notes, created_at, updated_at
      FROM feeding_records
    `
    
    const params: any[] = []
    let paramCount = 0

    // Add search condition if provided
    if (search) {
      paramCount++
      sql += ` WHERE (food_type ILIKE $${paramCount} OR notes ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    // Add ordering
    sql += ` ORDER BY feeding_time ${sort === 'asc' ? 'ASC' : 'DESC'}`

    // Add pagination
    paramCount++
    sql += ` LIMIT $${paramCount}`
    params.push(parseInt(limit as string))

    paramCount++
    sql += ` OFFSET $${paramCount}`
    params.push(parseInt(offset as string))

    // Execute the query
    const result = await query(sql, params)

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) FROM feeding_records'
    const countParams: any[] = []
    
    if (search) {
      countSql += ' WHERE (food_type ILIKE $1 OR notes ILIKE $1)'
      countParams.push(`%${search}%`)
    }

    const countResult = await query(countSql, countParams)
    const total = parseInt(countResult.rows[0].count)

    return {
      feedings: result.rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }
  } catch (error) {
    console.error('Error fetching feedings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch feedings'
    })
  }
})
