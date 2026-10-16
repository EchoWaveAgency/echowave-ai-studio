import fs from 'fs';
import path from 'path';
import { initializeDatabase, query, closePool } from '../../platform/database/connection';
import { logger } from '../../platform/logging/logger';

const migrationsDir = path.join(__dirname, 'migrations');

interface Migration {
  name: string;
  up: string;
  down: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const files = fs.readdirSync(migrationsDir).sort();
  const migrations: Migration[] = [];

  for (const file of files) {
    if (file.endsWith('.ts')) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const nameMatch = content.match(/export const name = ['"]([^'"]+)['"]/);
      const upMatch = content.match(/export const up = [`"]([^`"]*)[`"]/s);
      const downMatch = content.match(/export const down = [`"]([^`"]*)[`"]/s);

      if (nameMatch && upMatch && downMatch) {
        migrations.push({
          name: nameMatch[1],
          up: upMatch[1],
          down: downMatch[1],
        });
      }
    }
  }

  return migrations;
}

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row) => row.name);
}

async function runMigration(migration: Migration): Promise<void> {
  try {
    await query(migration.up);
    await query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
    logger.info(`Migration executed: ${migration.name}`);
  } catch (error) {
    logger.error(`Migration failed: ${migration.name}`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  try {
    // Parse connection string
    const url = new URL(dbUrl);
    initializeDatabase({
      host: url.hostname,
      port: parseInt(url.port || '5432'),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
    });

    await ensureMigrationsTable();
    const migrations = await loadMigrations();
    const executed = await getExecutedMigrations();

    const pending = migrations.filter((m) => !executed.includes(m.name));

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Running ${pending.length} pending migrations...`);

    for (const migration of pending) {
      await runMigration(migration);
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
