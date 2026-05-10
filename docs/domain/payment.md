# Payment

Platobná transakcia cez 24-pay. **24-pay je zdroj pravdy**; ClubUp eviduje iba metadata.

## Schéma

| Pole | Typ | Required | Popis |
|---|---|---|---|
| `_id` | ObjectId | ✓ | |
| `orderId` | ObjectId | ✓ | Parent objednávka |
| `transactionId` | string | ✓ | ID transakcie z 24-pay (unique) |
| `state` | enum | ✓ | `pending`, `succeeded`, `failed`, `refunded`, `partially_refunded` |
| `method` | enum | – | `card`, `bank_transfer`, `google_pay`, `apple_pay`, `tatra_pay`, ... |
| `amountCents` | number | ✓ | |
| `currency` | string | ✓ | |
| `failureCode` | string | – | Kód chyby od 24-pay |
| `failureMessage` | string | – | Človeku-čitateľné vysvetlenie |
| `refundedAmountCents` | number | – | Akumulovaná refundovaná suma |
| `last4` | string | – | Posledné 4 čísla karty (ak ide o kartu) |
| `cardBrand` | string | – | `visa`, `mastercard`, ... |
| `paymentInitiatedAt` | Date | ✓ | Kedy sme volali `POST /payment` |
| `paymentCompletedAt` | Date | – | |
| `webhookEventIds` | string[] | – | Všetky webhook event IDs, ktoré sa tejto platby týkali |
| `rawPayload` | object | – | Celý posledný payload z 24-pay (pre debug/audit) |
| `createdAt` | Date | ✓ | |
| `updatedAt` | Date | ✓ | |

## Indexy

```ts
db.payments.createIndex({ transactionId: 1 }, { unique: true });
db.payments.createIndex({ orderId: 1, createdAt: -1 });
db.payments.createIndex({ state: 1, paymentInitiatedAt: -1 });
```

## Pravidlá

- **Žiadne čísla kariet, CVV, IBAN ani plné účty** — toto je výhradne v 24-pay (PCI DSS scope).
- `last4` a `cardBrand` sú jediné kartové dáta, ktoré ukladáme — sú nesensitive a používame ich na zobrazenie „Platba kartou •••• 1234".
- Pri refunde **NEVYTVÁRAME** nový `Payment` dokument — len update-ujeme `state` a `refundedAmountCents` na pôvodnom.
- Pri „re-pokuse" (napr. neúspešná platba a ďalší pokus) vznikne **nový `Payment` s novým `transactionId`** v rámci toho istého Orderu.
- `webhook_events` kolekcia eviduje každý prijatý webhook (pre idempotency a audit).

## Webhook events kolekcia

| Pole | Typ | Popis |
|---|---|---|
| `_id` | ObjectId | |
| `eventId` | string (unique) | ID webhooku z 24-pay |
| `eventType` | string | `payment.succeeded`, `payment.failed`, `payment.refunded`, ... |
| `transactionId` | string | |
| `payload` | object | celé telo webhooku |
| `signature` | string | HMAC podpis (overený) |
| `receivedAt` | Date | |
| `processedAt` | Date | |
| `processingError` | string | nullable, ak spracovanie zlyhalo |

```ts
db.webhook_events.createIndex({ eventId: 1 }, { unique: true });
db.webhook_events.createIndex({ transactionId: 1 });
db.webhook_events.createIndex({ receivedAt: -1 });
```

## Spracovanie webhooku

Detaily v [`../payments/integration.md`](../payments/integration.md). Krátko:

1. Verifikuj HMAC podpis (`x-24pay-signature` header).
2. Odmietni event s timestampom > 5 min v minulosti.
3. Skontroluj, či `eventId` ešte nie je v `webhook_events` — ak je, vráť 200 OK (idempotency).
4. Otvor MongoDB transakciu:
   - insert do `webhook_events` (unique index zabezpečí jednorazovosť)
   - update `Payment.state`
   - update `Order.state` (paid/failed/refunded)
   - ak `paid`: vytvor `Enrollment` (ak ešte neexistuje), vytvor `Progress`
   - ak `refunded`: zruš `Enrollment` (state=cancelled)
5. Vráť 200 OK. Ak chyba → 500, 24-pay webhook zopakuje.

## Príklad

```json
{
  "_id": "ObjectId('...')",
  "orderId": "ObjectId('...')",
  "transactionId": "24p_2026_xyz123abc",
  "state": "succeeded",
  "method": "card",
  "amountCents": 49000,
  "currency": "EUR",
  "last4": "4242",
  "cardBrand": "visa",
  "paymentInitiatedAt": "2026-09-15T14:23:30Z",
  "paymentCompletedAt": "2026-09-15T14:25:14Z",
  "webhookEventIds": ["24p_evt_abc123"],
  "createdAt": "2026-09-15T14:23:30Z",
  "updatedAt": "2026-09-15T14:25:14Z"
}
```
