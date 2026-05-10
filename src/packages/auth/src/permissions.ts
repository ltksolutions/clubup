// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import type { Role } from './rbac.js';

/**
 * Permission matrix.
 *
 * Each permission key maps to the set of roles allowed to execute it.
 * The full canonical list lives in docs/auth/rbac.md — keep them in sync.
 *
 * This file shows the shape; expand with the full inventory when wiring
 * up the apps. For now we ship a representative slice covering all
 * permission categories.
 */

export const PERMISSIONS = {
  // Course content
  'course.read.published': ['student', 'instructor', 'content_manager', 'admin'],
  'course.read.draft': ['content_manager', 'admin'],
  'course.create': ['content_manager', 'admin'],
  'course.update': ['content_manager', 'admin'],
  'course.publish': ['admin'],
  'course.archive': ['admin'],
  'course.delete': ['admin'],
  'course.create_new_version': ['content_manager', 'admin'],

  // Tests & attempts
  'test.create': ['content_manager', 'admin'],
  'test.update': ['content_manager', 'admin'],
  'test_attempt.start': ['student', 'instructor', 'content_manager', 'admin'],
  'test_attempt.submit': ['student', 'instructor', 'content_manager', 'admin'],
  'test_attempt.reset': ['admin'],

  // Webinars
  'webinar.create': ['instructor', 'content_manager', 'admin'],
  'webinar.update': ['instructor', 'content_manager', 'admin'],

  // Enrollments
  'enrollment.read.own': ['student', 'instructor', 'content_manager', 'admin'],
  'enrollment.read.all': ['admin'],
  'enrollment.create': ['admin'],
  'enrollment.cancel': ['admin'],

  // Orders & payments
  'order.read.own': ['student', 'admin'],
  'order.read.all': ['admin'],
  'order.create': ['student', 'instructor', 'content_manager', 'admin'],
  'order.refund': ['admin'],

  // Certificates
  'certificate.read.own': ['student', 'instructor', 'content_manager', 'admin'],
  'certificate.issue': ['admin'],
  'certificate.revoke': ['admin'],

  // Audit
  'audit.read': ['admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Returns true if any of the given roles is allowed to perform the action.
 */
export function can(roles: readonly Role[], permission: Permission): boolean {
  const allowed = PERMISSIONS[permission];
  return roles.some((r) => (allowed as readonly Role[]).includes(r));
}
