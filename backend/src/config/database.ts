import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;

// Initialize Drizzle ORM instance with pool
let db: ReturnType<typeof drizzle> | null = null;
let pool: InstanceType<typeof Pool> | null = null;

export const initializeDatabase = async () => {
  try {
    // Create pool only when initializing (after env vars are loaded)
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const connectionUrl = new URL(connectionString);
    console.log(`Connecting to database host: ${connectionUrl.hostname}`);

    pool = new Pool({
      connectionString: connectionString,
    });

    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0]);
    
    // Create Drizzle instance
    db = drizzle(pool);
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Export database instance for use in other files
export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};
