// SPDX-FileCopyrightText: 2025 Ján Letko / LTK Solutions s.r.o.
// SPDX-License-Identifier: EUPL-1.2

/**
 * Domain-specific error classes used across @clubup/db and dependent layers.
 *
 * Convention:
 * - Each error has a stable `code` for client/handler matching.
 * - Throw these instead of generic `Error`; route handlers map them to HTTP status.
 */

export class DomainError extends Error {
  abstract code: string;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFound extends DomainError {
  code = 'not_found';
  constructor(resource: string) {
    super(`Resource not found: ${resource}`);
  }
}

export class ValidationError extends DomainError {
  code = 'validation';
  constructor(
    message: string,
    public errors?: unknown
  ) {
    super(message);
  }
}

export class Unauthorized extends DomainError {
  code = 'unauthorized';
  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class Forbidden extends DomainError {
  code = 'forbidden';
  constructor(permission: string) {
    super(`Forbidden: missing permission ${permission}`);
  }
}

export class Conflict extends DomainError {
  code = 'conflict';
  constructor(reason: string) {
    super(`Conflict: ${reason}`);
  }
}

export class PreconditionFailed extends DomainError {
  code = 'precondition_failed';
  constructor(reason: string) {
    super(`Precondition failed: ${reason}`);
  }
}

export class PaymentGatewayError extends DomainError {
  code = 'payment_gateway';
  constructor(
    public providerCode: string,
    message: string
  ) {
    super(`Payment gateway error [${providerCode}]: ${message}`);
  }
}

export class RefundError extends DomainError {
  code = 'refund_error';
  constructor(
    public providerCode: string,
    message: string
  ) {
    super(`Refund error [${providerCode}]: ${message}`);
  }
}
