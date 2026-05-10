// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * Course — top of the curriculum hierarchy.
 *
 * One Course (e.g. "Športový manažment pre silnejšie kluby") contains
 * multiple Levels, each Level holds the same set of Topics, and each
 * (Topic × Level) intersection is one Module.
 *
 * See: docs/domain/course.md
 */

export const CourseStateSchema = z.enum(['draft', 'published', 'archived']);
export type CourseState = z.infer<typeof CourseStateSchema>;

export const CoursePricingSchema = z.object({
  /** Full course price in cents (49000 = 490,00 €). */
  fullCourseCents: z.number().int().nonnegative(),
  /** Optional Level 1 standalone price in cents. */
  level1Cents: z.number().int().nonnegative().nullable(),
  /** Optional group license price in cents (e.g. 5 enrollments). */
  groupLicenseCents: z.number().int().nonnegative().nullable(),
  /** Group license seat count if `groupLicenseCents` is set. */
  groupLicenseSeats: z.number().int().positive().nullable(),
  /** Optional mentor add-on price in cents. */
  mentorPackageCents: z.number().int().nonnegative().nullable(),
  /** Currency — ISO 4217. MVP supports EUR only. */
  currency: z.literal('EUR'),
  /** VAT included in displayed prices. */
  vatIncluded: z.boolean(),
});
export type CoursePricing = z.infer<typeof CoursePricingSchema>;

export const CourseSchema = z.object({
  _id: z.instanceof(ObjectId),

  /** Stable URL slug — same across versions of the same logical course. */
  slug: z.string().regex(/^[a-z0-9-]+$/),

  /** Display title in Slovak. */
  title: z.string().min(1),

  /** Short marketing description (1–2 sentences). */
  shortDescription: z.string().max(280),

  /** Long form description for the course detail page (markdown allowed). */
  longDescription: z.string(),

  /** Ordered list of Level ObjectIds. Level order is sequential gating. */
  levels: z.array(z.instanceof(ObjectId)),

  /** Optional final course-level test. */
  courseTestId: z.instanceof(ObjectId).nullable(),

  /** Estimated total study hours, integer. */
  estimatedHours: z.number().int().positive(),

  /** Pricing tiers. */
  pricing: CoursePricingSchema,

  /** Lifecycle state. Only `published` is publicly visible. */
  state: CourseStateSchema,

  /** Versioning — see docs/domain/versioning.md. */
  version: z.number().int().positive(),
  previousVersionId: z.instanceof(ObjectId).nullable(),

  /** Audit timestamps. */
  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string(),
  publishedAt: z.date().nullable(),
  archivedAt: z.date().nullable(),
});
export type Course = z.infer<typeof CourseSchema>;

/**
 * Indexes (apply in migrations):
 * - { slug: 1, version: -1 }                          // current version lookup
 * - { state: 1, publishedAt: -1 }                     // public catalog
 * - { previousVersionId: 1 }                          // version chain traversal
 */
