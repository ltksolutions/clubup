# API — REST a Server Actions

> Špecifikácia REST endpointov a Server Actions pre `app.clubup.sk` a `admin.clubup.sk`.

## Princípy

ClubUp má **dvojakú API vrstvu**:

1. **REST endpointy** (Route Handlers v `app/api/...`) — pre klient → server volania, ktoré idú cez verejnú sieť (mobil, third-party, webhooks). Mapované na štandardné HTTP metódy.
2. **Server Actions** — pre interné mutácie, ktoré používa náš vlastný frontend cez form actions alebo `<form action>`. Nemajú verejný REST endpoint; volajú sa cez `'use server'` mechanizmus.

Voľba medzi REST a Server Action:

| Použiť REST | Použiť Server Action |
|---|---|
| Volá to externý systém (24-pay webhook, Mux callback) | Mutácia z formulára („uložiť profil") |
| Volá to mobilná aplikácia (v budúcnosti) | Mutácia z buttonu („označiť časť ako dokončenú") |
| Treba caching cez HTTP cache headers | Mutácia, ktorá invaliduje React cache |
| Public read (katalóg kurzov pre SEO) | Interný fetch v RSC |

## Common conventions

### Base URL

| Prostredie | URL |
|---|---|
| Produkcia (študent) | `https://app.clubup.sk/api` |
| Produkcia (admin) | `https://admin.clubup.sk/api` |
| Preview | `https://<deployment>.vercel.app/api` |
| Lokálne dev | `http://localhost:3000/api` |

### Verziovanie

V tomto MVP **nemáme prefix `/v1`**. Keď budeme potrebovať breaking change, zavedieme `/v2/...` paralelne so starým `/api/...`.

### Authentifikácia

REST endpointy majú jednu z týchto autentifikácií:

| Auth typ | Header | Popis |
|---|---|---|
| Session cookie | `Cookie: __Secure-clubup.session=...` | Default pre logged-in užívateľov (Auth.js v5). HttpOnly + Secure + SameSite=Lax. |
| Žiadna | — | Public endpointy: `GET /api/courses`, `GET /verify/...` |
| Webhook signature | `x-24pay-signature: ...` | Webhook z 24-pay |
| API key (v budúcnosti) | `Authorization: Bearer ...` | Pre mobilnú aplikáciu / 3rd party — zatiaľ nie je v MVP |

**Žiadne JWT v hlavičke pre browser klientov.** Cookies sú bezpečnejšie (HttpOnly = nedostupné z JS).

### Content type

Všetky requesty aj odpovede sú **`application/json`** s UTF-8.

Webhooky od 24-pay môžu byť `application/x-www-form-urlencoded` — handler musí parsovať obe.

### Error format

Všetky chybové odpovede používajú jednotný JSON formát:

```json
{
  "error": "course_not_found",
  "message": "Kurz s týmto slug-om neexistuje",
  "details": { "slug": "neexistuje" }
}
```

| HTTP status | Kedy |
|---|---|
| 200 | OK, success |
| 201 | Created |
| 204 | No content (úspešný delete) |
| 400 | Bad request (zlý JSON, chýba parameter) |
| 401 | Unauthorized (nie je session) |
| 403 | Forbidden (session je, ale nemá rolu) |
| 404 | Not found |
| 409 | Conflict (napr. duplicate enrollment) |
| 422 | Unprocessable entity (validačná chyba — Zod) |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

### Pagination

Zoznamy sa stránkujú cez query parametre:

```
GET /api/admin/courses?page=2&pageSize=20&sort=-createdAt
```

| Param | Default | Max |
|---|---|---|
| `page` | 1 | — |
| `pageSize` | 20 | 100 |
| `sort` | `-createdAt` | — |

Response:

```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "totalItems": 47,
    "totalPages": 3
  }
}
```

### Idempotency

Mutačné endpointy s rizikom duplicate (napr. „submit test", „checkout") akceptujú hlavičku:

```
Idempotency-Key: <uuid-v4>
```

Server uloží odpoveď do `idempotency_keys` kolekcie s TTL 24h. Pri rovnakom kľúči vráti uloženú odpoveď bez opakovania mutácie.

### Rate limiting

| Endpoint typ | Limit |
|---|---|
| Public read (katalóg) | 60 req / min / IP |
| Authenticated read | 120 req / min / session |
| Mutácie | 30 req / min / session |
| Test attempt start | 10 / 15 min / (studentId, testId) |
| Webhook (24-pay) | bez limitu, ale podpis musí sedieť |

Rate limit hlavičky v odpovedi:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1762800000
```

## Skupiny endpointov

| Skupina | Súbor |
|---|---|
| Courses (verejné a admin) | [`courses.md`](courses.md) |
| Enrollments | [`enrollments.md`](enrollments.md) |
| Orders & Payments | [`orders.md`](orders.md) |
| Webhooks (24-pay, Mux, Teams) | [`webhooks.md`](webhooks.md) |
| OpenAPI spec | [`openapi.yaml`](openapi.yaml) |

## OpenAPI

Strojovo-čitateľná špecifikácia v [`openapi.yaml`](openapi.yaml). Používa sa pre:

- Generovanie typed klienta (`packages/api-client`) cez `openapi-typescript`
- Validáciu pri runtime (request/response schémy)
- Dokumentáciu cez Swagger UI / Redoc (na `/api/docs` v admin app, len pre admin role)

## Server Actions vs REST — naša voľba

V tomto projekte **väčšina mutácií ide cez Server Actions** (krátšie, bezpečnejšie, lepšia DX). REST endpointy sú primárne pre:

- **Webhooky** (`/api/webhooks/24pay`, `/api/webhooks/mux`)
- **Public read** (`/api/courses` ak by sme chceli SEO indexáciu cez API; väčšinou je to v page render)
- **Mux signed URLs** (`/api/parts/[id]/playback-url`) — kvôli krátkej lifetime
- **Verifikácia certifikátu** (`/verify/[regNumber]`) — public

Ostatné mutácie (vytvor objednávku, označ časť dokončenú, submit test) idú cez Server Actions. Detaily v [`../architecture/backend.md`](../architecture/backend.md).
