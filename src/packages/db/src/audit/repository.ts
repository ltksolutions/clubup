// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { ObjectId, type ClientSession } from 'mongodb';

import { getDb } from '../client.js';

import { AuditEntrySchema, type AuditEntry, type AuditTarget } from './schema.js';

const COLLECTION = 'audit_logs';

export interface RecordAuditInput {
  actor: string;
  actorRoles: string[];
  action: string;
  target: AuditTarget;
  context?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Append a single audit entry. Should be called inside the same
 * transaction as the action it audits, where applicable.
 */
export async function recordAudit(
  input: RecordAuditInput,
  opts: { session?: ClientSession } = {}
): Promise<AuditEntry> {
  const entry: AuditEntry = AuditEntrySchema.parse({
    _id: new ObjectId(),
    actor: input.actor,
    actorRoles: input.actorRoles,
    action: input.action,
    target: input.target,
    context: input.context,
    timestamp: new Date(),
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  const db = await getDb();
  await db.collection(COLLECTION).insertOne(entry, { session: opts.session });
  return entry;
}

export async function listAuditForTarget(
  target: AuditTarget,
  opts: { session?: ClientSession; limit?: number } = {}
): Promise<AuditEntry[]> {
  const db = await getDb();
  const docs = await db
    .collection(COLLECTION)
    .find(
      { 'target.type': target.type, 'target.id': target.id },
      { session: opts.session }
    )
    .sort({ timestamp: -1 })
    .limit(opts.limit ?? 100)
    .toArray();
  return docs.map((d) => AuditEntrySchema.parse(d));
}
