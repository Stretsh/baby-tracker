import { Pool } from 'pg'

// Get runtime config
const config = useRuntimeConfig()

// Create a connection pool
const pool = new Pool({
  host: config.public.dbHost || 'localhost',
  port: parseInt(config.public.dbPort || '5432'),
  database: config.public.dbName || 'baby_feeding',
  user: config.public.dbUser || 'postgres',
  password: config.dbPassword || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
})

// Test the connection
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true') {
    console.log('Connected to PostgreSQL database')
  }
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

export { pool }

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    
    if (process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true') {
      console.log('Executed query', { text, duration, rows: res.rowCount })
    }
    
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// Helper function to get a client from the pool
export async function getClient() {
  return await pool.connect()
}
