// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * Audit log — immutable record of privileged actions.
 *
 * Used for refunds, manual grants, course publish/archive, certificate
 * issuance/revocation, role changes. See: docs/operations/security.md
 *
 * Records are append-only (no updates, no deletes — except retention cleanup).
 */

export const AuditTargetSchema = z.object({
  type: z.enum([
    'course',
    'level',
    'topic',
    'module',
    'part',
    'test',
    'question',
    'enrollment',
    'order',
    'payment',
    'certificate',
    'webinar',
    'user',
  ]),
  id: z.string(),
});
export type AuditTarget = z.infer<typeof AuditTargetSchema>;

export const AuditEntrySchema = z.object({
  _id: z.instanceof(ObjectId),

  /** Who performed the action — sportup_person_id. */
  actor: z.string(),

  /** Roles the actor held at the time of the action. */
  actorRoles: z.array(z.string()),

  /** Stable permission identifier (e.g. "course.publish", "order.refund"). */
  action: z.string(),

  /** What was acted upon. */
  target: AuditTargetSchema,

  /** Free-form context. Should NOT include PII; reference IDs only. */
  context: z.record(z.unknown()).optional(),

  /** When the action happened. */
  timestamp: z.date(),

  /** IP address of the actor (for security forensics). */
  ipAddress: z.string().nullable(),

  /** User agent of the request. */
  userAgent: z.string().nullable(),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

/**
 * Indexes (apply in migrations):
 * - { actor: 1, timestamp: -1 }
 * - { 'target.type': 1, 'target.id': 1, timestamp: -1 }
 * - { action: 1, timestamp: -1 }
 * - { timestamp: 1 }                                   // retention TTL (24 months)
 */
