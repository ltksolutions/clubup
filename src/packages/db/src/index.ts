// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * @clubup/db — public entry point.
 *
 * Consumers typically import from sub-paths (e.g. `@clubup/db/courses`)
 * for tree-shaking and clearer ownership. This index re-exports the
 * cross-cutting primitives only.
 */

export { getDb, withTransaction, closeDb } from './client.js';
export type { ClientSession, Db } from './client.js';

export {
  DomainError,
  NotFound,
  ValidationError,
  Unauthorized,
  Forbidden,
  Conflict,
  PreconditionFailed,
  PaymentGatewayError,
  RefundError,
} from './errors.js';

export { ObjectId } from 'mongodb';
