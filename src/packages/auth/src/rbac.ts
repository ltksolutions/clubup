// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * ClubUp role taxonomy.
 *
 * Roles are derived from the `sportup_roles` claim in the OIDC ID token.
 * Mapping rules in `mapRoles()`. See: docs/auth/rbac.md
 */

export const ROLES = ['student', 'instructor', 'content_manager', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Map SportUp claims to ClubUp roles.
 *
 * Anyone with a baseline SportUp account becomes a `student` in ClubUp.
 * Higher-privilege roles are explicit, set by SportUp admins.
 */
export function mapRoles(sportupRoles: readonly string[]): Role[] {
  const out = new Set<Role>();

  if (
    sportupRoles.includes('sportup:user') ||
    sportupRoles.includes('clubup:student')
  ) {
    out.add('student');
  }
  if (sportupRoles.includes('clubup:instructor')) out.add('instructor');
  if (sportupRoles.includes('clubup:content_manager')) out.add('content_manager');
  if (sportupRoles.includes('clubup:admin')) out.add('admin');

  return Array.from(out);
}

export function hasRole(roles: readonly Role[], role: Role): boolean {
  return roles.includes(role);
}

export function hasAnyRole(
  roles: readonly Role[],
  required: readonly Role[]
): boolean {
  return required.some((r) => roles.includes(r));
}
