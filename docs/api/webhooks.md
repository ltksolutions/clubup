# API — Webhooks

Webhook endpointy prijímajú **asynchrónne notifikácie** od externých systémov: 24-pay (platby), Mux (video upload), Microsoft Teams (recordings, attendance).

## Všeobecné princípy

| Princíp | Detail |
|---|---|
| **Verifikácia podpisu** | Každý webhook má hlavičku alebo body field s podpisom; bez správneho podpisu vrátime 401. Nikdy neveríme telu bez verifikácie. |
| **Idempotencia** | Externé systémy môžu webhook zopakovať (retry pri network error). Každý webhook event ukladáme do `webhook_events` kolekcie s unique indexom; pri duplicate vrátime 200 bez opakovania spracovania. |
| **Rýchle ack** | Webhook handler musí odpovedať do < 5s, inak externý systém retry-uje. Náročnú prácu (email, certifikát) deleguj na background job. |
| **Audit** | Každý prijatý webhook + výsledok spracovania ide do `audit_logs`. |
| **Žiadny rate limit** | Nepoužívame rate limiting na webhookoch (chceme prijať každý event), ale podpis nás chráni pred zneužitím. |

## 24-pay webhook

### `POST /api/webhooks/24pay`

24-pay nás notifikuje pri zmenách stavu platby:

- `payment.completed` — platba úspešne prijatá
- `payment.failed` — platba zlyhala
- `payment.refunded` — refund dokončený
- `payment.disputed` — chargeback (sporová platba)

**Headers:**

```
content-type: application/x-www-form-urlencoded   # alebo application/json (24-pay podporuje obe)
x-24pay-signature: <HMAC-SHA256 hex>
x-24pay-event-id: evt_abc123
x-24pay-timestamp: 1762800000
```

**Verifikácia podpisu:**

```ts
import { createHmac, timingSafeEqual } from 'crypto';

function verify24PaySignature(rawBody: string, signature: string, secret: string): boolean {
  const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
  if (computed.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}
```

**Body príklad (`payment.completed`):**

```json
{
  "eventId": "evt_abc123",
  "eventType": "payment.completed",
  "occurredAt": "2026-09-15T14:23:00Z",
  "payment": {
    "id": "pay_xyz789",
    "merchantOrderId": "order_abc123",
    "amount": 49000,
    "currency": "EUR",
    "method": "card",
    "cardBrand": "visa",
    "cardLast4": "1234",
    "transactionId": "TXN-202609150042",
    "settledAt": "2026-09-15T14:23:00Z"
  }
}
```

**Spracovanie:**

```ts
// app/api/webhooks/24pay/route.ts
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-24pay-signature');
  const eventId = req.headers.get('x-24pay-event-id');
  
  // 1. Verify signature
  if (!signature || !verify24PaySignature(rawBody, signature, process.env.PAYMENT_24PAY_SECRET!)) {
    return new Response('invalid signature', { status: 401 });
  }
  
  // 2. Idempotency check
  const event = JSON.parse(rawBody);
  const existing = await db.collection('webhook_events').findOne({ provider: '24pay', eventId });
  if (existing) {
    return new Response('ok', { status: 200 });  // already processed
  }
  
  // 3. Record event + process atomicky
  await withTransaction(async (session) => {
    await db.collection('webhook_events').insertOne({
      provider: '24pay',
      eventId,
      eventType: event.eventType,
      payload: event,
      receivedAt: new Date(),
    }, { session });
    
    switch (event.eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(event.payment, { session });
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.payment, { session });
        break;
      case 'payment.refunded':
        await handlePaymentRefunded(event.payment, { session });
        break;
      case 'payment.disputed':
        await handlePaymentDisputed(event.payment, { session });
        break;
    }
  });
  
  // 4. Return ack rýchlo
  return new Response('ok', { status: 200 });
}

async function handlePaymentCompleted(payment, opts) {
  const order = await findOrderById(payment.merchantOrderId, opts);
  if (!order) throw new Error('order_not_found');
  if (order.state !== 'pending') return; // už bolo spracované, idempotent
  
  // Update Order
  await updateOrder(order._id, { state: 'paid', paidAt: new Date() }, opts);
  
  // Create Payment record
  await createPayment({
    orderId: order._id,
    gateway: '24pay',
    transactionId: payment.transactionId,
    amountCents: payment.amount,
    state: 'completed',
    method: payment.method,
    settledAt: new Date(payment.settledAt),
  }, opts);
  
  // Create Enrollment
  const enrollment = await enrollStudent({
    studentId: order.studentId,
    courseId: order.courseId,
    reason: 'paid',
    orderId: order._id,
  }, opts);
  
  // Schedule async tasks (email, invoice)
  await queueJob('send_purchase_confirmation', { orderId: order._id, enrollmentId: enrollment._id });
}
```

Detaily HMAC, signature scheme a refund flow v [`../payments/integration.md`](../payments/integration.md).

## Mux webhook

### `POST /api/webhooks/mux`

Mux nás notifikuje pri:

- `video.asset.ready` — upload spracovaný, asset je pripravený na prehrávanie
- `video.asset.errored` — chyba pri spracovaní
- `video.upload.cancelled` — admin zrušil upload

**Headers:**

```
mux-signature: t=1762800000,v1=<HMAC-SHA256 hex>
```

Mux používa formát s timestampom a viacerými verziami signature (kvôli rotácii kľúčov). Ich SDK má `Mux.Webhooks.verifyHeader()` helper.

**Body príklad (`video.asset.ready`):**

```json
{
  "type": "video.asset.ready",
  "data": {
    "id": "asset_abc123",
    "playback_ids": [
      { "id": "playback_xyz", "policy": "signed" }
    ],
    "duration": 1080,
    "passthrough": "{\"partId\":\"part_1_4_1\",\"blockId\":\"block_2\"}"
  }
}
```

> `passthrough` je field, ktorý nastavujeme pri create-uploade — slúži ako náš tracking. Obsahuje JSON s `partId` a `blockId`, aby sme vedeli, kam patrí.

**Spracovanie:**

```ts
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('mux-signature');
  
  if (!Mux.Webhooks.verifyHeader(rawBody, signature, process.env.MUX_WEBHOOK_SECRET!)) {
    return new Response('invalid signature', { status: 401 });
  }
  
  const event = JSON.parse(rawBody);
  
  if (event.type === 'video.asset.ready') {
    const passthrough = JSON.parse(event.data.passthrough);
    const playbackId = event.data.playback_ids[0].id;
    
    await updatePartContentBlock({
      partId: passthrough.partId,
      blockId: passthrough.blockId,
      muxAssetId: event.data.id,
      muxPlaybackId: playbackId,
      durationSec: event.data.duration,
      state: 'ready',
    });
    
    // Notifikuj admina, ktorý uploadoval
    await queueJob('notify_video_ready', { partId: passthrough.partId, blockId: passthrough.blockId });
  }
  
  return new Response('ok', { status: 200 });
}
```

## Microsoft Teams / Graph webhook (Fáza 2)

V MVP používame **manuálny upload** záznamu webinára do Mux. V Fáze 2 prejdeme na automatizáciu cez Microsoft Graph subscriptions.

### `POST /api/webhooks/teams`

Subscription notification pri:

- `onlineMeetingRecording` — záznam dostupný v OneDrive

**Headers:**

```
content-type: application/json
```

**Validation token flow:** Microsoft Graph pri prvej subscription pošle GET request s `validationToken` query parametrom — server musí odpovedať `text/plain` s tým istým tokenom. Toto je v setup phase, nie pri runtime.

**Body príklad:**

```json
{
  "value": [
    {
      "subscriptionId": "...",
      "subscriptionExpirationDateTime": "...",
      "changeType": "created",
      "resource": "users/{user-id}/onlineMeetings/{meeting-id}/recordings/{recording-id}",
      "tenantId": "...",
      "clientState": "<naša náhodná hodnota, kontrolujeme>"
    }
  ]
}
```

**Spracovanie:**

1. Verifikuj `clientState` (porovnaj s našou uloženou hodnotou)
2. Stiahni recording cez Graph API (`GET /onlineMeetings/{id}/recordings/{id}/content`)
3. Upload do Mux cez Direct Upload
4. Po `mux.video.asset.ready` (čo dorazí ako Mux webhook), update `Webinar.recordingPlaybackId`

V MVP toto NEROBÍME — admin manuálne stiahne z Teams a uploadne do Mux. Implementácia v Fáze 2.

## Vlastné webhook eventy (out)

Pre integráciu so SportUp ekosystémom môžeme **vystavovať vlastné webhook eventy** (out):

- `clubup.enrollment.created` — keď sa študent zapíše
- `clubup.course.completed` — keď študent dokončí kurz
- `clubup.certificate.issued` — keď bol vydaný certifikát

Toto NIE je v MVP. V Fáze 3 keď bude SportUp.sk centrálny bus pre všetky aplikácie ekosystému, vystavíme tieto eventy.

## Webhook events kolekcia

Schéma:

```ts
type WebhookEvent = {
  _id: ObjectId;
  provider: '24pay' | 'mux' | 'teams';
  eventId: string;        // unique per provider
  eventType: string;
  payload: object;        // raw payload
  signature: string;      // pre audit
  receivedAt: Date;
  processedAt?: Date;
  processingResult?: 'success' | 'error';
  errorMessage?: string;
};
```

Indexy:

```ts
db.webhook_events.createIndex({ provider: 1, eventId: 1 }, { unique: true });
db.webhook_events.createIndex({ provider: 1, receivedAt: -1 });
db.webhook_events.createIndex({ processedAt: 1 }, { sparse: true });
```

## Testovanie webhookov lokálne

Pre lokálny dev používame **ngrok** alebo **Vercel preview deployment**:

```bash
# Lokálne s ngrok
ngrok http 3000
# → https://abc123.ngrok.io

# V 24-pay merchant dashboard nastavíme:
# Webhook URL = https://abc123.ngrok.io/api/webhooks/24pay
```

Mux má webhook test feature priamo v dashboarde — vie poslať mock event na zadanú URL.
