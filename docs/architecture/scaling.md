# Stratégia škálovania

## Predpoklady

- **Štart**: 0–500 študentov v prvom roku (1 kurz, 4 úrovne)
- **Stredná fáza**: 500–5 000 študentov (3–5 kurzov)
- **Cieľ**: 5 000+ študentov (10+ kurzov, kluby objednávajú batch)

Toto sú **veľmi malé čísla** v porovnaní s typickým e-commerce. Hlavné výzvy nie sú QPS, ale **video bandwidth a webinár concurrency**.

## Vrstvy

### Marketingový web

- **Statický build na Vercel CDN** — neobmedzene škáluje
- Žiadny problém ani pri news article hit (10k req/min)

### Aplikácie (Next.js)

- **Vercel serverless functions** — autoscaling
- Limit: 1000 concurrent invocations (Pro plán) → s priemerom 500ms/request to je ~2000 RPS
- Pre cold starts používame Edge runtime kde sa dá (auth callback, jednoduché GET)

### MongoDB Atlas

| Tier | Cena (~) | RAM | vCPU | Storage | Vhodné pre |
|---|---|---|---|---|---|
| **M0 (free)** | 0 | 0.5 GB | shared | 0.5 GB | dev |
| **M10** | $0.08/h | 2 GB | 2 | 10 GB | start, do 1k používateľov |
| **M20** | $0.20/h | 4 GB | 2 | 20 GB | 1k–5k používateľov |
| **M30** | $0.54/h | 8 GB | 2 | 40 GB | 5k+ |

Naše queries sú jednoduché (find by id, find by slug, range query na progress). Žiadne joins, žiadne agregácie nad miliónmi dokumentov.

**Indexy** (bude detailne v `packages/db/indexes.ts`):

- `courses.slug` (unique)
- `enrollments.{studentId, courseId}` (unique compound)
- `enrollments.studentId` (pre dashboard)
- `progress.{enrollmentId, lessonId}` (unique compound)
- `orders.studentId`
- `orders.state` (pre cleanup expired pending)
- `webhook_events.eventId` (unique)
- `audit_logs.{actor, timestamp}`

### Mux (video)

- **Adaptive bitrate** → každý klient dostane optimálnu kvalitu pre svoje pripojenie
- **Edge delivery** — Mux má vlastný CDN
- Cena: ~$0.005/min sledovania (cca **5 €/mesiac za 1000 minút sledovania**)
- Pri 500 študentoch × 60 hodín obsahu × 30 min priemer pozretého = **drahé**
- **Mitigácia:** signed URLs s expiráciou, žiadny re-encoding, používame Mux pre HLS only (nie MP4)

Alternatíva pre dlhú budúcnosť: Cloudflare Stream alebo self-hosted (mediaCMS), ak Mux je príliš drahý.

### 24-pay

- Žiaden bottleneck — bežná rýchlosť ~200 platieb/minútu na merchant účet
- Náš expected throughput: 5–20 platieb / deň (väčšina kurzov sa kupuje raz)
- Webhook delay je obvykle < 5 sekúnd

### Email (Resend)

- Free tier: 3000 emailov/mesiac, 100/deň
- Pro: $20/mesiac za 50k emailov
- Náš throughput: confirmation po platbe + reminders → ~5k emailov/mesiac → free + buffer
- Newsletter pôjde cez **MailerLite** (oddelené od transakčných)

### Live výučba (Teams)

- Microsoft Teams má limit 1000 účastníkov per meeting (Standard) / 10000 (Premium)
- Náš cieľ: 50–200 účastníkov / webinár
- Žiaden škálovací problém

## Bottlenecks na ktoré dávame pozor

### 1. „Webinar storm"

Keď 200 ľudí sa naraz pripojí na webinár cez aplikáciu → lavica requests na `/api/webinars/{id}/join` → vygeneruje sa Teams join URL.

**Mitigácia:**
- Generujeme join URL pri vytvorení webinára, nie at request time
- URL sa cache-uje na CDN s `Cache-Control: private, max-age=600`
- Pre študenta je to len redirect na Teams

### 2. „Test storm"

Webinár končí, 200 ľudí naraz spustí záverečný test.

**Mitigácia:**
- Test je load-ed v batches (10 otázok naraz)
- Submit je synchrónna Server Action s rate limit 1/sec/user
- Vyhodnotenie je rýchle (in-memory comparison v Server Action)

### 3. „Mux signed URL spam"

Útočník volá v cykle endpoint pre signed URL, aby distribuoval naše videá.

**Mitigácia:**
- Rate limit 30/min/user na `/api/lessons/{id}/playback-url`
- Signed URL má expiráciu 6 hodín, viazané na `playback_id`
- Audit log podozrivých enumeration patterns

### 4. „MongoDB connection pool"

Vercel serverless funkcie môžu vytvoriť stovky connection-ov pri spike. MongoDB má connection limit (M10 = 1500).

**Mitigácia:**
- Connection pooling v `packages/db/client.ts` — globálny `MongoClient` per Lambda invocation, reused medzi requestami v rámci toho istého container
- Vercel automaticky reuses warm functions, takže pool zostáva
- Plus: pre čítanie public dát používame **MongoDB Atlas Data API** alebo **read replicas** (M30+)

## Cost forecast (rough)

Pre 1000 aktívnych študentov / mesiac:

| Položka | Cena / mesiac |
|---|---|
| Vercel Pro | $20 |
| MongoDB Atlas M10 | $60 |
| Mux (15k min sledovania) | $75 |
| Upstash Redis (rate limiting) | $5 |
| Resend (5k emailov) | $0 (free tier) |
| Sentry (10k events) | $0 (free tier) |
| Inngest (5k events) | $0 (free tier) |
| **Total** | **~$160 / mesiac** |

Pre 10 000 aktívnych študentov:

| Položka | Cena / mesiac |
|---|---|
| Vercel Pro | $20 |
| MongoDB Atlas M30 | $400 |
| Mux (150k min sledovania) | $750 |
| Upstash Redis | $20 |
| Resend Pro | $20 |
| Sentry Team | $26 |
| Inngest Pro | $30 |
| **Total** | **~$1 270 / mesiac** |

To je ~13 € / aktívny študent / mesiac, čo je únosné pri cene kurzu nad 100 €.

## Plán pre nepredvídané rastové scenáre

- **Viral moment** (TV repotráž, ministerská návšteva): static web držia, aplikácie horizontálne škálujú, MongoDB potrebuje upgrade. Pripravený upgrade-runbook v `operations/runbook-spike.md` (TBD).
- **Mux je príliš drahý**: migrácia na Cloudflare Stream — kompatibilná HLS, lacnejšia o 50–70% pri väčších objemoch. Migrácia ~2 týždne (re-upload videí, switch URLs).
- **MongoDB stagnuje**: na čítanie štatistík v admin používame agregačné pipelines a cache do Redisu (TTL 5 min).
