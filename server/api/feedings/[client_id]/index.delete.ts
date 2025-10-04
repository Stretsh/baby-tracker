import { query } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const clientId = getRouterParam(event, 'client_id')

    if (!clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'client_id is required'
      })
    }

    // Delete the feeding record by client_id
    const sql = 'DELETE FROM feeding_records WHERE client_id = $1 RETURNING id, client_id'

    const result = await query(sql, [clientId])

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feeding record not found'
      })
    }

    return {
      success: true,
      message: 'Feeding deleted successfully',
      client_id: clientId
    }

  } catch (error) {
    console.error('Error deleting feeding:', error)
    
    if (error.statusCode) {
      return {
        success: false,
        message: error.statusMessage || 'Failed to delete feeding'
      }
    }

    return {
      success: false,
      message: 'Failed to delete feeding record'
    }
  }
})
