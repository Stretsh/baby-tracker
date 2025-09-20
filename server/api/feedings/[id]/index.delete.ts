import { query } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required'
      })
    }

    // Delete the feeding record
    const sql = 'DELETE FROM feeding_records WHERE id = $1 RETURNING id'

    const result = await query(sql, [id])

    if (result.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Feeding record not found'
      })
    }

    return {
      success: true,
      message: 'Feeding deleted successfully',
      feedingId: parseInt(id)
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
