// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * @clubup/auth — public entry point.
 *
 * High-level: this package wraps Auth.js v5 with a SportUp OIDC provider
 * and adds RBAC helpers. Apps construct their own NextAuth instance with
 * `buildAuthConfig()` and the local provider list.
 *
 * Sub-paths:
 *   @clubup/auth/rbac          — Role taxonomy + mapRoles
 *   @clubup/auth/permissions   — Permission keys + can()
 *   @clubup/auth/guards        — createGuards(authLoader)
 */

export { mapRoles, hasRole, hasAnyRole, ROLES, type Role } from './rbac.js';
export { can, PERMISSIONS, type Permission } from './permissions.js';
export {
  createGuards,
  type AuthSession,
  type SessionLoader,
} from './guards.js';
export {
  mapToClubUpProfile,
  type ClubUpProfile,
  type RawIdTokenClaims,
} from './profile-mapping.js';

export { buildAuthConfig, type AuthConfigInput } from './config.js';
