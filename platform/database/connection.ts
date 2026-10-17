import { Pool, PoolClient } from 'pg';
import { logger } from '../logging/logger';

let pool: Pool | null = null;

interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export function initializeDatabase(config: DbConfig): Pool {
  if (pool) {
    logger.warn('Database pool already initialized');
    return pool;
  }

  pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.max || 20,
    idleTimeoutMillis: config.idleTimeoutMillis || 30000,
    connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  logger.info('Database pool initialized', {
    host: config.host,
    database: config.database,
    maxConnections: config.max,
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
}

export async function getClient(): Promise<PoolClient> {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool.connect();
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool.query(text, params);
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}
