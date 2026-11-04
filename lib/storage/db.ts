import { createDatabase, type Database } from 'db0';
import nodeSqlite from 'db0/connectors/node-sqlite';
import { SCHEMA } from './schema.ts';

export type Db = Database;

/** Opens (and creates if needed) the SQLite file, then applies the schema. */
export async function openDb(path: string): Promise<Db> {
  const db = createDatabase(nodeSqlite({ path }));
  await db.exec('PRAGMA busy_timeout = 5000');
  for (const statement of SCHEMA) await db.exec(statement);
  return db;
}
