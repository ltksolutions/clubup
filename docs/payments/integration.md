# 24-pay.sk — integrácia

> Implementačné detaily pre 24-pay platobnú bránu. Decision context v [`../decisions/0005-payments-24pay.md`](../decisions/0005-payments-24pay.md).

> **Status: koncepčný návrh.** 24-pay merchant účet ešte nie je aktivovaný; presná podoba HMAC podpisu, parametrov a webhook hlavičiek bude doplnená podľa aktuálnej 24-pay dokumentácie pri integrácii.

## Prehľad

24-pay je **hosted checkout** — čiže nákupný proces:

1. ClubUp vytvorí Order interne (state=`pending`) a vygeneruje payment session na 24-pay
2. Užívateľ je redirektovaný na `https://24-pay.sk/checkout/...`
3. Tam vyberie metódu (karta, TatraPay, ČSOB Pay, ...)
4. Po platbe je redirektovaný späť na ClubUp `/objednavky/{id}/return`
5. Zároveň 24-pay nezávisle pošle webhook na `/api/webhooks/24pay`
6. **Webhook je zdroj pravdy**, nie return URL

## Klient knižnica

Vlastná typed wrapper v `packages/payments-24pay`:

```ts
// packages/payments-24pay/index.ts
export {
  create24PayPayment,
  refund24PayPayment,
  verify24PayWebhookSignature,
  parse24PayWebhookEvent,
} from './client';
export type {
  PaymentSession,
  PaymentEvent,
  RefundResult,
} from './types';
```

## Vytvorenie payment session

```ts
// packages/payments-24pay/client.ts
import { createHmac } from 'node:crypto';

interface CreatePaymentArgs {
  orderId: string;          // náš variableSymbol
  amountCents: number;       // 49000 = 490,00 €
  currency: 'EUR';
  description: string;       // "ClubUp kurz: Športový manažment"
  customerEmail: string;
  customerName: string;
  returnUrl: string;         // kam redirektovať po platbe
  webhookUrl: string;        // kam pošle 24-pay notification
  language?: 'sk' | 'cs' | 'en';
  expiresInMinutes?: number;  // default 30
}

export async function create24PayPayment(args: CreatePaymentArgs): Promise<PaymentSession> {
  const merchantId = process.env.PAYMENT_24PAY_MERCHANT_ID!;
  const secret = process.env.PAYMENT_24PAY_SECRET!;
  const apiUrl = process.env.PAYMENT_24PAY_API_URL!;  // test vs prod
  
  const payload = {
    merchantId,
    variableSymbol: args.orderId,
    amount: (args.amountCents / 100).toFixed(2),    // "490.00"
    currency: args.currency,
    description: args.description,
    customer: {
      email: args.customerEmail,
      name: args.customerName,
    },
    returnUrl: args.returnUrl,
    notifyUrl: args.webhookUrl,
    language: args.language ?? 'sk',
    expiresInMinutes: args.expiresInMinutes ?? 30,
  };
  
  // HMAC podpis
  const signature = signPayload(payload, secret);
  
  const response = await fetch(`${apiUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Id': merchantId,
      'X-Signature': signature,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new PaymentGatewayError(error.code, error.message);
  }
  
  const result = await response.json();
  return {
    paymentId: result.paymentId,         // 24-pay interné ID
    redirectUrl: result.redirectUrl,     // kde má klient prejsť
    expiresAt: new Date(result.expiresAt),
  };
}
```

## HMAC-SHA256 podpis

Podpis sa generuje cez **deterministické serializovanie** payloadu:

```ts
function signPayload(payload: Record<string, any>, secret: string): string {
  const canonical = canonicalize(payload);
  return createHmac('sha256', secret)
    .update(canonical, 'utf8')
    .digest('hex');
}

function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}
```

> **Pozn.:** Presná schéma podpisu (poradie polí, oddeľovače, hex vs base64) môže byť odlišná podľa 24-pay dokumentácie. Tento snippet je **predloha** — pri integrácii treba overiť proti merchant docs.

### Verifikácia webhook podpisu

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verify24PayWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string
): boolean {
  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  
  if (computed.length !== signatureHeader.length) return false;
  
  return timingSafeEqual(
    Buffer.from(computed, 'hex'),
    Buffer.from(signatureHeader, 'hex')
  );
}
```

**Critical:** používame `timingSafeEqual`, nie `===`, kvôli timing attacks.

## Webhook handler

Plný handler s idempotency, viď [`../api/webhooks.md`](../api/webhooks.md). Zhrnutie krokov:

```ts
// app/api/webhooks/24pay/route.ts
import { verify24PayWebhookSignature, parse24PayWebhookEvent } from '@clubup/payments-24pay';
import { withTransaction } from '@clubup/db';

export async function POST(req: Request) {
  // 1. Read raw body (POZOR: musíme čítať raw, nie parsed JSON)
  const rawBody = await req.text();
  const signature = req.headers.get('x-24pay-signature');
  const eventId = req.headers.get('x-24pay-event-id');
  const timestamp = req.headers.get('x-24pay-timestamp');
  
  if (!signature || !eventId) {
    return new Response('missing headers', { status: 400 });
  }
  
  // 2. Verify signature
  if (!verify24PayWebhookSignature(rawBody, signature, process.env.PAYMENT_24PAY_SECRET!)) {
    await logSecurityEvent('webhook_invalid_signature', { eventId });
    return new Response('invalid signature', { status: 401 });
  }
  
  // 3. Replay protection — timestamp must be < 5 min old
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp) * 1000;
    if (Math.abs(age) > 5 * 60 * 1000) {
      return new Response('timestamp out of range', { status: 400 });
    }
  }
  
  // 4. Idempotent processing
  const event = parse24PayWebhookEvent(rawBody);
  
  await withTransaction(async (session) => {
    const existing = await db.collection('webhook_events').findOne(
      { provider: '24pay', eventId },
      { session }
    );
    if (existing) return;  // already processed
    
    await db.collection('webhook_events').insertOne({
      provider: '24pay',
      eventId,
      eventType: event.type,
      payload: JSON.parse(rawBody),
      receivedAt: new Date(),
    }, { session });
    
    await processPaymentEvent(event, { session });
  });
  
  return new Response('ok', { status: 200 });
}
```

## Spracovanie eventov

```ts
// packages/payments-24pay/process.ts
export async function processPaymentEvent(event: PaymentEvent, opts: { session: ClientSession }) {
  switch (event.type) {
    case 'payment.completed':
      return handlePaymentCompleted(event, opts);
    case 'payment.failed':
      return handlePaymentFailed(event, opts);
    case 'payment.expired':
      return handlePaymentExpired(event, opts);
    case 'payment.refunded':
      return handlePaymentRefunded(event, opts);
    case 'payment.disputed':
      return handlePaymentDisputed(event, opts);
    default:
      console.warn(`Unknown event type: ${event.type}`);
  }
}

async function handlePaymentCompleted(event: PaymentEvent, opts: { session: ClientSession }) {
  // 1. Find Order
  const order = await findOrderByVariableSymbol(event.variableSymbol, opts);
  if (!order) {
    await logError('order_not_found_for_payment', { variableSymbol: event.variableSymbol });
    return;
  }
  
  // 2. Skip if already paid (idempotent)
  if (order.state === 'paid') return;
  if (order.state === 'refunded' || order.state === 'cancelled') {
    await logError('payment_completed_for_finalized_order', { orderId: order._id });
    return;
  }
  
  // 3. Update Order
  await updateOrder(order._id, {
    state: 'paid',
    paidAt: new Date(event.settledAt),
  }, opts);
  
  // 4. Create Payment record
  await createPayment({
    orderId: order._id,
    gateway: '24pay',
    transactionId: event.transactionId,
    paymentId: event.paymentId,
    amountCents: event.amountCents,
    currency: event.currency,
    method: event.method,         // 'card', 'tatrapay', 'csob_pay', ...
    cardBrand: event.cardBrand,
    cardLast4: event.cardLast4,
    state: 'completed',
    settledAt: new Date(event.settledAt),
  }, opts);
  
  // 5. Create Enrollment
  await enrollStudent({
    studentId: order.studentId,
    courseId: order.courseId,
    reason: 'paid',
    orderId: order._id,
  }, opts);
  
  // 6. Schedule async tasks (mimo transakcie)
  await queueJob('send_purchase_confirmation_email', { orderId: order._id });
  await queueJob('generate_invoice', { orderId: order._id });
}
```

## Refund

```ts
export async function refund24PayPayment(args: {
  paymentId: string;
  amountCents: number;
  reason: string;
}): Promise<RefundResult> {
  const payload = {
    merchantId: process.env.PAYMENT_24PAY_MERCHANT_ID,
    paymentId: args.paymentId,
    amount: (args.amountCents / 100).toFixed(2),
    reason: args.reason,
  };
  
  const signature = signPayload(payload, process.env.PAYMENT_24PAY_SECRET!);
  
  const response = await fetch(`${process.env.PAYMENT_24PAY_API_URL}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-Id': process.env.PAYMENT_24PAY_MERCHANT_ID!,
      'X-Signature': signature,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new RefundError(error.code, error.message);
  }
  
  const result = await response.json();
  return {
    refundId: result.refundId,
    state: result.state,                     // 'pending', 'completed', 'failed'
    estimatedSettlementDate: result.estimatedSettlementDate,
  };
}
```

Refund je **asynchrónny** — 24-pay vytvorí refund záznam, ale skutočný credit na bankovom účte zákazníka môže trvať 1–5 pracovných dní podľa banky. Webhook `payment.refunded` príde pri finálnom settlement.

## Test mode

24-pay merchant účet má **test mode** s testovacími kartami:

| Karta | Výsledok |
|---|---|
| `4111 1111 1111 1111` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |

Test mode má vlastný `PAYMENT_24PAY_API_URL` (typicky `https://test.24-pay.sk/api`) a vlastné credentials.

V dev/preview environments používame test mode; v production prod credentials.

## Environment variables

| Variable | Príklad | Popis |
|---|---|---|
| `PAYMENT_24PAY_MERCHANT_ID` | `M-12345` | Merchant ID priradený 24-pay |
| `PAYMENT_24PAY_SECRET` | `(64 hex)` | HMAC secret — nikdy v kóde |
| `PAYMENT_24PAY_API_URL` | `https://api.24-pay.sk/v1` | API endpoint (test vs prod) |
| `PAYMENT_24PAY_RETURN_URL` | `https://app.clubup.sk/objednavky/{id}/return` | Template (s placeholderom) |
| `PAYMENT_24PAY_WEBHOOK_URL` | `https://app.clubup.sk/api/webhooks/24pay` | Webhook endpoint |

## Faktúry

ClubUp generuje slovenské daňové faktúry, NIE 24-pay. 24-pay nám len posiela transactionId, ktoré ide ako referencia na faktúre. Detaily generovania faktúr viď [`../api/orders.md`](../api/orders.md).

## Bezpečnosť

- **Secret nikdy v repe** — Vercel env vars only
- **HMAC podpis na všetkých requestoch + webhookoch** — bez výnimky
- **Timestamp validation** v webhookoch — replay protection (5 min window)
- **Idempotency cez `webhook_events`** kolekciu (unique eventId)
- **Audit log** každej platby a refundu
- **PCI DSS compliance** — žiadne čísla kariet u nás; všetko v 24-pay
- **GDPR** — `cardLast4` a `cardBrand` ukladáme (legitímny záujem pre dispute resolution); plné číslo karty NEKEDY

## Failure modes & monitoring

| Stav | Detekcia | Akcia |
|---|---|---|
| Webhook nedoručený | Order zostáva `pending` po 30+ min | Cron skontroluje 24-pay API status; ak je `paid` → manuálne process |
| Duplicate webhook | Druhý pokus s tým istým `eventId` | Idempotent skip |
| Bad signature | `verify24PayWebhookSignature` vráti false | 401 + Sentry alert |
| Order neexistuje | `findOrderByVariableSymbol` vráti null | Sentry alert (prípadný attack alebo data corruption) |
| Webhook po `cancelled` orderi | `order.state === 'cancelled' && payment.completed` | Log, no-op (refund už beží alebo bol urobený) |

Sentry alerts:

- **Critical:** invalid signature, order not found, payment to cancelled order
- **Warning:** webhook latency > 30s, refund failed
- **Info:** payment completed, refund completed

## Multi-gateway readiness

Architektúra `Order` ↔ `Payment` umožňuje **viac brán** v budúcnosti:

```ts
type Payment = {
  orderId: ObjectId;
  gateway: '24pay' | 'stripe' | 'paypal';
  // ...
};
```

V MVP iba 24-pay. Stripe by sa pridal pre EÚ mimo SK (po expanzii) cez novú `packages/payments-stripe`.
