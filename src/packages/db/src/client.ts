// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { MongoClient, type Db, type ClientSession } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Get a singleton Mongo Db instance. Connects lazily on first call.
 *
 * In Next.js this works correctly across hot reloads thanks to module caching.
 * In serverless (Vercel) connections are reused per warm invocation.
 */
export async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!dbName) throw new Error('MONGODB_DB_NAME is not set');

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 30_000,
    retryWrites: true,
    retryReads: true,
  });

  await client.connect();
  db = client.db(dbName);
  return db;
}

/**
 * Run a function inside a Mongo transaction.
 *
 * Use for cross-collection writes that must be atomic
 * (e.g., create Order + Enrollment + Progress).
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>
): Promise<T> {
  if (!client) await getDb();
  if (!client) throw new Error('Mongo client not initialized');

  const session = client.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Close the Mongo connection. Used in tests and graceful shutdown.
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export type { ClientSession, Db };
