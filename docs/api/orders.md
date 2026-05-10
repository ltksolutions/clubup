# API — Orders & Payments

Endpointy pre objednávky a platby cez 24-pay.

## Flow nákupu (high-level)

```
Študent klikne "Kúpiť"
    │
    ▼
[Server Action] createOrder()
    ├─ vytvor Order so state="pending"
    └─ vytvor 24-pay payment session
    │
    ▼
Redirect na 24-pay (https://24-pay.sk/...)
    │
    ▼
Študent vyberie platobnú metódu, zaplatí
    │
    ▼
24-pay redirektuje späť: GET /objednavky/[id]/return
    │   (toto je FYI návrat, nie zdroj pravdy — môže lagovat)
    ▼
Študent vidí "spracúvame platbu..."
    │
    ▼
24-pay nezávisle pošle webhook: POST /api/webhooks/24pay
    │
    ▼
[Webhook handler] verifyHmac → updateOrder → createEnrollment → email
    │
    ▼
Študent po refresh-i vidí "Platba úspešná, máte prístup"
```

Detaily 24-pay HMAC, signature scheme a webhook sú v [`../payments/integration.md`](../payments/integration.md).

## Endpointy pre študenta

### `POST /api/orders` (Server Action ekvivalent)

Vytvorí novú objednávku a vráti URL pre redirect na 24-pay.

**Auth:** session
**Idempotency-Key:** odporúčané (deduplicate doubleclick)
**Body:**

```json
{
  "courseId": "course_sportovy_manazment",
  "billingAddress": {
    "firstName": "Mária",
    "lastName": "Nováková",
    "email": "maria@klub.sk",
    "phone": "+421900123456",
    "street": "Trnavská 100",
    "city": "Bratislava",
    "postalCode": "82101",
    "country": "SK"
  },
  "billingType": "personal",
  "agreedTos": true,
  "agreedRefundPolicy": true
}
```

ALEBO firemná faktúra:

```json
{
  "courseId": "course_sportovy_manazment",
  "billingAddress": {
    "companyName": "ŠK Bratislava, o.z.",
    "ico": "12345678",
    "dic": "2023456789",
    "icDph": "SK2023456789",
    "street": "...",
    "city": "...",
    "postalCode": "...",
    "country": "SK",
    "contactEmail": "ekonom@klub.sk",
    "contactPerson": "Mária Nováková"
  },
  "billingType": "company",
  "sponsorOrgId": "sportup_org_id_klubu",
  "agreedTos": true,
  "agreedRefundPolicy": true
}
```

**Response 201:**

```json
{
  "orderId": "order_abc123",
  "amount": 49000,
  "currency": "EUR",
  "redirectUrl": "https://24-pay.sk/checkout/?merchantId=...&orderId=order_abc123&signature=..."
}
```

Klient po prijatí robí `window.location.href = redirectUrl`.

### `GET /api/orders/me`

Moje objednávky.

**Auth:** session
**Response 200:**

```json
{
  "data": [
    {
      "_id": "order_abc123",
      "courseId": "course_sportovy_manazment",
      "courseTitle": "Športový manažment pre silnejšie kluby",
      "amountCents": 49000,
      "currency": "EUR",
      "state": "paid",
      "createdAt": "2026-09-15T14:00:00Z",
      "paidAt": "2026-09-15T14:23:00Z",
      "invoiceUrl": "https://cdn.clubup.sk/invoices/INV-2026-0042.pdf"
    }
  ]
}
```

### `GET /api/orders/:id`

Detail objednávky (musí byť vlastná).

**Auth:** session, vlastník
**Response 200:** kompletný order + posledný `Payment` + invoice URL.

### `GET /api/orders/:id/invoice`

Stiahne PDF faktúru.

**Auth:** session, vlastník
**Response 200:** `application/pdf` stream

### `POST /api/orders/:id/retry-payment`

Po neúspešnej platbe (state=`failed` alebo `expired`) vytvorí nový Payment session pre ten istý Order.

**Auth:** session, vlastník
**Response 200:** `{ "redirectUrl": "https://24-pay.sk/..." }`

## Public „return" endpoint

### `GET /objednavky/:id/return` (page, nie API)

Stránka, na ktorú 24-pay redirektuje študenta po platbe. Server-side renderuje stav objednávky:

- `state: paid` → „Ďakujeme, máte prístup. Pokračovať na kurz →"
- `state: pending` → „Spracúvame platbu, prosím počkajte..." + auto-refresh
- `state: failed` → „Platba zlyhala, skúste znova"

Toto NIE je zdroj pravdy o platbe — slúži len pre UX. Zdroj pravdy je webhook.

## Endpointy pre admina

### `GET /api/admin/orders`

Zoznam všetkých objednávok.

**Auth:** `admin`
**Query:**

| Param | Popis |
|---|---|
| `state` | filter podľa state |
| `studentId` | |
| `courseId` | |
| `createdAfter` | ISO date |
| `createdBefore` | ISO date |

### `GET /api/admin/orders/:id`

Detail orderu pre admina (vrátane všetkých Payment záznamov, audit logu, súvisiacich webhook eventov).

### `POST /api/admin/orders/:id/refund`

Vráti peniaze cez 24-pay refund API. Spustí asynchrónny refund flow.

**Auth:** `admin`
**Idempotency-Key:** vyžadované
**Body:**

```json
{
  "amount": 49000,
  "reason": "Zákazník požiadal o vrátenie v rámci 14 dní",
  "alsoCancelEnrollment": true
}
```

**Response 202 Accepted:**

```json
{
  "ok": true,
  "refundId": "...",
  "state": "pending",
  "estimatedSettlementDate": "2026-09-20"
}
```

> 24-pay refundy nie sú okamžité — môžu trvať 1–5 pracovných dní podľa banky. Webhook od 24-pay potvrdí finálny stav.

### `GET /api/admin/orders/:id/audit`

Audit log pre konkrétny order.

**Auth:** `admin`

## Faktúry

ClubUp generuje **slovenské daňové faktúry** v slovenčine s povinnými náležitosťami podľa zákona č. 222/2004 Z. z. o DPH:

- Číslo faktúry (sekvenčné, formát `INV-YYYY-NNNN`)
- Dátum vystavenia
- Dátum dodania (= deň úspešnej platby)
- Dodávateľ: LTK Solutions s.r.o. (IČ DPH ak je platiteľ)
- Odberateľ: zo `billingAddress`
- Kurz ako položka, cena bez DPH, DPH 20%, cena s DPH
- IBAN, BIC
- Spôsob platby: „Online platba kartou cez 24-pay"
- Variabilný symbol = order ID

PDF generujeme cez `puppeteer` v Vercel Lambda (alebo `@react-pdf/renderer` ak treba server-side React rendering bez headless Chrome).

Pre B2C bez `companyName` je faktúra vystavená na fyzickú osobu.

## Stripe / iné brány v budúcnosti

Architektúra `Order` ↔ `Payment` umožňuje **multi-gateway** v budúcnosti:

```ts
type Payment = {
  orderId: ObjectId;
  gateway: '24pay' | 'stripe' | 'paypal';
  transactionId: string;  // unikátne v rámci gateway
  // ...
};
```

V MVP iba 24-pay.
