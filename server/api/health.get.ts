import { query } from '../utils/database'

export default defineEventHandler(async (event) => {
  try {
    // Test database connection
    await query('SELECT 1')
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    }
  } catch (error) {
    console.error('Health check failed:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Health check failed - database connection error'
    })
  }
})
