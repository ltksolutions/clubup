// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * Map raw OIDC ID-token claims to a ClubUp profile object.
 * Strips noise, maps roles, applies defaults.
 *
 * See: docs/auth/token-claims.md
 */

import { mapRoles, type Role } from './rbac.js';

export interface ClubUpProfile {
  sportupPersonId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  picture: string | null;
  locale: string;
  timezone: string;
  roles: Role[];
  /** Only present if requested via UserInfo (not in ID token). */
  birthDate: string | null;
  /** Whether SportUp has run identity verification on this person. */
  verified: boolean;
}

export interface RawIdTokenClaims {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string | null;
  locale?: string;
  zoneinfo?: string;
  birthdate?: string;
  sportup_roles?: string[];
  sportup_verified_person?: boolean;
  [key: string]: unknown;
}

export function mapToClubUpProfile(claims: RawIdTokenClaims): ClubUpProfile {
  return {
    sportupPersonId: claims.sub,
    name: claims.name ?? '',
    email: claims.email ?? '',
    emailVerified: claims.email_verified ?? false,
    picture: claims.picture ?? null,
    locale: claims.locale ?? 'sk-SK',
    timezone: claims.zoneinfo ?? 'Europe/Bratislava',
    roles: mapRoles(claims.sportup_roles ?? []),
    birthDate: claims.birthdate ?? null,
    verified: claims.sportup_verified_person ?? false,
  };
}
