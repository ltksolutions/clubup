// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

import { Forbidden, Unauthorized } from '@clubup/db';

import { can, type Permission } from './permissions.js';
import type { Role } from './rbac.js';

/**
 * Minimal session shape this package needs.
 *
 * The actual Auth.js Session type is augmented in app code (apps/*/auth.ts).
 * Here we accept any object that exposes the user identity and roles —
 * keeps this package decoupled from a particular app's NextAuth augmentation.
 */
export interface AuthSession {
  user: {
    sportupPersonId: string;
    name?: string | null;
    email?: string | null;
    roles: Role[];
  };
}

export type SessionLoader = () => Promise<AuthSession | null>;

/**
 * Build guard helpers bound to a session loader.
 *
 * Apps wire this up once with their `auth()` helper from Auth.js.
 *
 * @example
 *   import { auth } from '@/auth';
 *   import { createGuards } from '@clubup/auth/guards';
 *
 *   const { requirePermission, requireSession } = createGuards(auth);
 *
 *   export async function publishCourse(id: string) {
 *     const session = await requirePermission('course.publish');
 *     // ...
 *   }
 */
export function createGuards(loadSession: SessionLoader) {
  async function requireSession(): Promise<AuthSession> {
    const session = await loadSession();
    if (!session) throw new Unauthorized();
    return session;
  }

  async function requirePermission(permission: Permission): Promise<AuthSession> {
    const session = await requireSession();
    if (!can(session.user.roles, permission)) {
      throw new Forbidden(permission);
    }
    return session;
  }

  async function requireRole(role: Role): Promise<AuthSession> {
    const session = await requireSession();
    if (!session.user.roles.includes(role)) {
      throw new Forbidden(`role:${role}`);
    }
    return session;
  }

  return { requireSession, requirePermission, requireRole };
}
