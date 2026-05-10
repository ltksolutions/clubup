// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * Enrollment — a student's right to access a Course.
 *
 * Created either after a paid Order, after a manual admin grant, or
 * via a group license. Held until expiration or cancellation.
 *
 * See: docs/domain/enrollment.md
 */

export const EnrollmentStateSchema = z.enum([
  'active',
  'cancelled',
  'expired',
  'completed',
]);
export type EnrollmentState = z.infer<typeof EnrollmentStateSchema>;

export const EnrollmentReasonSchema = z.enum([
  'paid',
  'group_license',
  'manual_grant',
  'free_promo',
]);
export type EnrollmentReason = z.infer<typeof EnrollmentReasonSchema>;

export const EnrollmentSchema = z.object({
  _id: z.instanceof(ObjectId),

  /** Pointer to SportUp central registry — never a local user table. */
  studentId: z.string().min(1),

  /** Which Course version this enrollment grants access to. */
  courseId: z.instanceof(ObjectId),

  /** How this enrollment came to be. */
  reason: EnrollmentReasonSchema,

  /** If the enrollment came from an Order, link it for invoice/refund chains. */
  orderId: z.instanceof(ObjectId).nullable(),

  /** Sponsor org for group licenses (e.g. a club paying for its staff). */
  sponsorOrgId: z.string().nullable(),

  /** Lifecycle. */
  state: EnrollmentStateSchema,

  /** When access starts (inclusive). */
  startsAt: z.date(),

  /** When access expires (inclusive); null = no expiration set. */
  expiresAt: z.date().nullable(),

  /** Set when the student finishes the whole course. */
  completedAt: z.date().nullable(),

  /** Final certificate (issued after course completion). */
  finalCertificateId: z.instanceof(ObjectId).nullable(),

  /** Per-level intermediate certificates (Level 3, Level 4 in MVP). */
  intermediateCertificateIds: z.array(z.instanceof(ObjectId)),

  /** Audit timestamps. */
  createdAt: z.date(),
  updatedAt: z.date(),
  cancelledAt: z.date().nullable(),
  cancelledBy: z.string().nullable(),
  cancelReason: z.string().nullable(),
});
export type Enrollment = z.infer<typeof EnrollmentSchema>;

/**
 * Indexes (apply in migrations):
 * - { studentId: 1, courseId: 1, state: 1 }            // unique active per pair
 * - { courseId: 1, state: 1 }                           // course rosters
 * - { sponsorOrgId: 1, state: 1 }                       // org dashboards
 * - { expiresAt: 1 }                                    // expiry cron
 *
 * Constraint: only one `active` Enrollment per (studentId, courseId).
 * Enforce via partial unique index:
 *   { studentId: 1, courseId: 1 }  partialFilterExpression: { state: 'active' }
 */
