# Monitoring

> Ako monitorujeme zdravie ClubUp v produkcii.

## Princípy

- **Proactive** — alerts nás budia keď je problém, nie užívateľ
- **Actionable** — každý alert má jasné next steps
- **Low noise** — radšej menej alertov ale relevantných
- **Cost-conscious** — pre 0–5000 študentov nepotrebujeme enterprise APM

## Stack

| Vrstva | Nástroj | Pricing |
|---|---|---|
| Error tracking | **Sentry** | $26/mes (Team plan, 100k events) |
| Performance / RUM | **Vercel Speed Insights** | Zahrnuté vo Vercel Pro |
| Uptime monitoring | **UptimeRobot** | $7/mes |
| Logs | **Vercel Logs** + **Better Stack** (drain) | $0–25/mes |
| Status page | **Better Stack Status** | $0/mes (free tier) |
| Database | **MongoDB Atlas Charts + Performance Advisor** | Zahrnuté v M10 |

Total monitoring cost: **~$60/mes**.

## Sentry

### Setup

```ts
// apps/app/instrumentation.ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? 'development',  // production / preview / development
    tracesSampleRate: 0.1,    // 10% trace sampling
    profilesSampleRate: 0.1,
    
    beforeSend(event, hint) {
      // Strip sensitive data
      if (event.request?.cookies) {
        event.request.cookies = '[REDACTED]';
      }
      // Don't send auth errors (expected)
      if (hint.originalException?.code === 'unauthorized') return null;
      return event;
    },
  });
}
```

### Čo trackujeme

- **Unhandled exceptions** v Server Components, Route Handlers, Server Actions, client components
- **Manual capture** pri kritických chybách:

```ts
import * as Sentry from '@sentry/nextjs';

try {
  await issueFinalCertificate(enrollmentId);
} catch (e) {
  Sentry.captureException(e, {
    tags: { feature: 'certificate', priority: 'high' },
    contexts: { enrollment: { enrollmentId } },
  });
  throw e;
}
```

### Alerts

| Alert | Threshold | Notification |
|---|---|---|
| New error type appeared | First occurrence | Slack #clubup-alerts |
| Error rate > baseline | 10% increase v 5 min | Slack + email |
| Critical error (tag:priority:high) | Immediate | Slack + SMS |
| Webhook signature invalid | > 5 v 1 hod | Slack (potenciálny attack) |
| Payment processing error | Immediate | Slack + SMS |

## Vercel Analytics + Speed Insights

Auto-enabled v `apps/app` a `apps/admin`. Sleduje:

- **Core Web Vitals** — LCP, FID, CLS, INP
- **Page views** — top stránky, geo distribution
- **Performance** per route — server response times

**Threshold alerts** (Vercel Speed Insights):

- LCP > 2.5s (75th percentile) — varovanie
- CLS > 0.1 (75th percentile) — varovanie

## UptimeRobot

External monitoring (mimo nášho infrastruktúry):

| Monitor | URL | Interval | Alert |
|---|---|---|---|
| Marketing web | `https://clubup.sk` | 5 min | Email + SMS |
| App | `https://app.clubup.sk/api/health` | 1 min | Email + SMS |
| Admin | `https://admin.clubup.sk/api/health` | 5 min | Email |
| Mux webhook | `https://app.clubup.sk/api/webhooks/mux` (HEAD only) | 5 min | Email |

Health endpoint vráti 200 ak:

```ts
// apps/app/app/api/health/route.ts
export async function GET() {
  try {
    await db.collection('courses').findOne({}, { projection: { _id: 1 } });  // DB ping
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    return Response.json({ status: 'degraded', error: 'database' }, { status: 503 });
  }
}
```

## MongoDB Atlas Charts + Performance Advisor

Monitorujeme:

- **Slow queries** — Performance Advisor odporučí indexy
- **Connection pool usage** — pri 80%+ scale-up alebo optimalizácia connection reuse
- **Disk usage** — alert pri 80% disku
- **Replica lag** — alert pri > 10s lag medzi primary a secondary

Custom dashboardy v Atlas Charts:

- Active enrollments per Course
- Revenue per týždeň
- Course completion rate
- Test pass rate per Module
- Top failing test questions (kandidáti na revíziu)

## Logy

Vercel logs sú default — držia sa 24h v Vercel UI. Pre dlhšie retention:

### Drain do Better Stack

```yaml
# Vercel project settings → Log Drains → Better Stack
endpoint: https://in.logs.betterstack.com
format: ndjson
```

Better Stack retention: **30 dní** (free tier), **180 dní** (paid).

### Štruktúra logu

Server logy sú JSON s týmito polami:

```ts
{
  timestamp: '2026-09-15T14:23:00Z',
  level: 'info' | 'warn' | 'error',
  message: 'Order paid',
  service: 'clubup-app',
  requestId: 'req_abc',
  userId: 'sportup_person_id_X',
  orderId: 'order_id_Y',
  // ...context
}
```

### Logger

```ts
// packages/logger/index.ts
export const logger = {
  info: (msg: string, ctx: object) => console.log(JSON.stringify({ level: 'info', message: msg, ...ctx })),
  warn: (msg: string, ctx: object) => console.warn(JSON.stringify({ level: 'warn', message: msg, ...ctx })),
  error: (msg: string, ctx: object) => console.error(JSON.stringify({ level: 'error', message: msg, ...ctx })),
};
```

**Žiadne PII v logoch** — emails, mená, IBAN nelogujeme. Iba IDs.

## Status page

`status.clubup.sk` (cez Better Stack subdomain) — verejná status stránka:

- Marketing web
- Študentská app
- Admin app
- Platobná brána (24-pay)
- Video streaming (Mux)

Pri incidents (manuálne updaty + auto detection cez UptimeRobot).

## Business metrics

V admin dashboarde zobrazujeme **business KPIs** (nie technical):

- **MRR/ARR** (Monthly/Annual Recurring Revenue) — napriek tomu že nemáme subscriptions, useful pre tracking
- **Enrollment rate** — koľko nákupov / koľko návštev katalógu
- **Cart abandonment** — koľko vytvorených objednávok zlyhá pri platbe
- **Course completion rate** — % zapísaných, ktorí dokončia kurz
- **Module dropoff** — kde študenti prestanú pokračovať
- **NPS** — Net Promoter Score (po dokončení kurzu)

Implementované cez Mongo aggregations + serverless API endpoint pre admin dashboard.

## Incident response

### Severity levels

| Severity | Definícia | Response time | Príklad |
|---|---|---|---|
| **SEV-1** | Aplikácia úplne nedostupná | < 30 min | App down, DB outage |
| **SEV-2** | Critical feature broken | < 2 hod | Payments failing, login broken |
| **SEV-3** | Degraded experience | < 24 hod | Slow page loads, ne-kritické errors |
| **SEV-4** | Minor issue | Best effort | UI typo, drobný UX bug |

### Runbook

1. **Detekcia** — alert (Sentry, UptimeRobot) alebo user report
2. **Acknowledge** — odpovedz v Slack, vytvor incident v Better Stack
3. **Investigate** — Sentry + logs + Vercel deployments
4. **Mitigate** — rollback, hotfix, scale up
5. **Communicate** — status page update, ak SEV-1/SEV-2 aj email userom
6. **Resolve** — overiť, že všetko funguje
7. **Postmortem** — pre SEV-1/SEV-2 napísať blameless postmortem do internej dokumentácie

### Postmortem template

```md
# Postmortem: <názov incidentu>

**Date:** YYYY-MM-DD
**Severity:** SEV-?
**Duration:** XX min
**Author:** <meno>

## Summary
1–2 vety čo sa stalo a kto bol ovplyvnený.

## Timeline
- HH:MM — first alert
- HH:MM — investigation started
- HH:MM — root cause identified
- HH:MM — mitigation applied
- HH:MM — resolved

## Root cause
Technický popis.

## Impact
Koľko užívateľov, koľko peňazí, aký data loss.

## What went well
...

## What didn't go well
...

## Action items
- [ ] Akcia (owner, deadline)
```

## Cost optimization

Mesačné náklady na monitoring (orientačne):

| Položka | $/mes |
|---|---|
| Sentry Team | $26 |
| UptimeRobot | $7 |
| Better Stack Logs | $25 |
| Vercel Speed Insights | $0 (Pro plan) |
| MongoDB Charts | $0 (Atlas M10) |
| **Total** | **~$60** |

Pri prekročení 5000 študentov vyhodnotíme prechod na enterprise APM (Datadog, New Relic) — typicky $200–500/mes pre náš objem, ale bohatšie features.
