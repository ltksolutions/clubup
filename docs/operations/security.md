# Bezpečnosť

> Bezpečnostné praktiky pre ClubUp.

## Princípy

1. **Defense in depth** — viaceré nezávislé vrstvy ochrany
2. **Least privilege** — minimum oprávnení, čo úloha vyžaduje
3. **Secure by default** — nové features začínajú s prísnym nastavením
4. **No secrets in repo** — všetko cez Vercel env vars
5. **Auditované** — pre každú senzitívnu akciu existuje audit log

## Secrets management

### Pravidlá

- **Žiadne secrets v kóde** — ani v komentároch, testoch, fixtures
- **Žiadne secrets v `.env` v repe** — `.env.example` áno (placeholder hodnoty)
- **`.env.local` je gitignored** — pre lokálny dev
- **Production secrets** — Vercel Environment Variables → Encrypted
- **Rotácia** — secrets s reálnym dopadom (DB, OIDC, payment) rotujeme **každých 12 mesiacov** alebo pri podozrení

### Detection

- Pre-commit hook (Husky + git-secrets) — bráni commit-u API kľúčov
- GitHub Secret Scanning — automaticky beží na push
- Pri detekcii: okamžite rotovať + audit logov

### Inventár

| Secret | Kde | Rotácia |
|---|---|---|
| `MONGODB_URI` | Vercel env (prod) | 12 mes |
| `AUTH_SECRET` | Vercel env (per-app) | 12 mes alebo pri zmene tímu |
| `SPORTUP_OIDC_CLIENT_SECRET` | Vercel env | Synchrónne so SportUp |
| `PAYMENT_24PAY_SECRET` | Vercel env | 12 mes |
| `MUX_TOKEN_SECRET` | Vercel env | 6 mes |
| `MUX_SIGNING_KEY_SECRET` | Vercel env | 6 mes |
| `RESEND_API_KEY` | Vercel env | 12 mes |
| `SENTRY_DSN` | Vercel env (verejný DSN) | Per project |
| `MS_GRAPH_CLIENT_SECRET` | Vercel env | 12 mes |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel env | 12 mes |

## Network security

### TLS

- **TLS 1.3** všade (Vercel default)
- HTTP automatic redirect na HTTPS
- HSTS header s `max-age=31536000; includeSubDomains; preload`
- Certifikáty: Let's Encrypt (cez Vercel)

### CORS

Strict same-origin policy:

```ts
// app/api/.../route.ts
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const allowedOrigins = ['https://app.clubup.sk', 'https://admin.clubup.sk'];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('forbidden', { status: 403 });
  }
  // ...
}
```

Pre webhooky (`/api/webhooks/*`) **nemáme CORS check** — externé systémy nemajú origin. Chránime cez podpis.

### CSP (Content Security Policy)

V `next.config.js`:

```js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://*.sentry.io;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.mux.com https://image.mux.com https://cdn.clubup.sk;
  media-src 'self' blob: https://*.mux.com https://stream.mux.com;
  connect-src 'self' https://*.mux.com https://*.sentry.io https://*.vercel-insights.com;
  frame-src 'self' https://*.teams.microsoft.com;
  base-uri 'self';
  form-action 'self' https://24-pay.sk https://*.24-pay.sk;
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'Content-Security-Policy', value: cspHeader },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]}];
  },
};
```

`'unsafe-inline'` v `script-src` je tu kvôli Next.js inline boot scripts; časom prejdeme na CSP nonces.

## Authentication & session

Detaily v [`../auth/`](../auth/). Zhrnutie bezpečnostných opatrení:

- **OIDC s PKCE** (S256), nonce, state validácia
- **HttpOnly + Secure + SameSite=Lax** cookies
- **Encrypted session JWE** (AUTH_SECRET ≥ 32 random bytes)
- **Refresh token rotation** s reuse detection
- **Backchannel logout** support

## Authorization

Detaily v [`../auth/rbac.md`](../auth/rbac.md). Zhrnutie:

- RBAC s 4 rolami (`student`, `instructor`, `content_manager`, `admin`)
- Permissions matrix s explicit `can(roles, permission)` checks
- **Server-side enforcement** v každej Server Action a Route Handler
- Ownership checks pre vlastné údaje
- Audit log pre privileged akcie

## Input validation

Všetky vstupy validované cez **Zod**:

```ts
import { z } from 'zod';

const CreateOrderSchema = z.object({
  courseId: z.string().regex(/^[a-f0-9]{24}$/),  // ObjectId format
  billingType: z.enum(['personal', 'company']),
  billingAddress: z.object({ /* ... */ }),
  agreedTos: z.literal(true),
  agreedRefundPolicy: z.literal(true),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'validation', details: parsed.error.flatten() },
      { status: 422 }
    );
  }
  // ...
}
```

**Žiadne `any` v handler-och** — striktné typy + Zod runtime validation.

## XSS prevention

- React auto-escape v JSX (default)
- Žiadne `dangerouslySetInnerHTML` bez sanitizácie cez `DOMPurify`
- Markdown obsah z user-generated zdrojov (žiadny v MVP — všetok obsah je od adminov) renderovaný cez `react-markdown` s safe defaults
- CSP + HttpOnly cookies = aj keby XSS sa stane, session sa nedá ukradnúť

## CSRF prevention

- **Server Actions** majú built-in origin validation v Next.js
- **POST API endpoints** kontrolujú `Origin` header (rovnako ako CORS)
- **Auth.js** automaticky pridáva CSRF token pre `POST /api/auth/*`

## SQL/NoSQL injection

- Žiadne string concatenation v queries
- Mongo native driver používa parameterizované queries
- **Žiadne `$where` operátory** s user inputom
- **`Object.fromEntries(searchParams)` validate cez Zod** pred použitím v query

## Rate limiting

Všetky public endpointy majú rate limit cez Upstash Redis (viď [`../architecture/backend.md`](../architecture/backend.md)). Špecifické limity:

| Endpoint | Limit |
|---|---|
| Login (Auth.js callback) | 10 / 15 min / IP |
| Test attempt start | 10 / 15 min / (studentId, testId) |
| Create order | 5 / 1 hod / studentId |
| Webhook (24-pay) | bez limitu (chránené podpisom) |
| Public read | 60 / 1 min / IP |

Pri prekročení vrátime `429 Too Many Requests` s `Retry-After` headerom.

## Database security

### MongoDB Atlas

- **Network**: whitelist Vercel IPs (alebo 0.0.0.0/0 + strong credentials)
- **Auth**: SCRAM-SHA-256, žiadny password reuse medzi prostrediami
- **Encryption at rest** — automatické v Atlas (AES-256)
- **Encryption in transit** — TLS 1.2+
- **Audit log** — povolený v Atlas; logy v M30+ (M10 obmedzené)
- **Backup** — Continuous Cloud Backup, 7 dní point-in-time recovery

### Database users

| User | Práva | Use case |
|---|---|---|
| `clubup_app_prod` | readWrite na `clubup_prod` | Production aplikácie |
| `clubup_admin` | dbAdmin | Manuálne admin operácie (cez tooling, nie production app) |
| `clubup_backup` | backup | Backup automatizácia |

App **nikdy** nepoužíva `clubup_admin` credentials.

## Mux video security

- **Signed playback URLs** s 6h expiráciou (viď [`../decisions/0006-video-mux.md`](../decisions/0006-video-mux.md))
- JWT podpis cez `MUX_SIGNING_KEY_SECRET`, validuje Mux pri requeste
- Server overí, že volajúci má aktívny enrollment na rodičovskom kurze

## Payment security

- **PCI DSS compliance** — žiadne čísla kariet u nás (viď [`../payments/integration.md`](../payments/integration.md))
- HMAC-SHA256 podpis na všetkých requestoch + webhookoch
- Timestamp validation v webhookoch (replay protection)
- Idempotency cez `webhook_events` kolekciu

## Email security

- **SPF, DKIM, DMARC** records pre `clubup.sk`
- Resend vystavuje DKIM kľúče, my pridáme do DNS
- DMARC policy `p=quarantine` (po stabilizácii `p=reject`)
- Žiadne odkazy na user-controlled URLs v transactional emailoch

## Dependency security

- `npm audit` v CI pipeline (lint.yml)
- **Dependabot** alerts + auto-PRs pre security updates
- Týždenný review otvorených Dependabot PRs
- **Lockfile** (`package-lock.json`) committnutý
- **No `npm install` v production builds** — len `npm ci` (deterministic)

## Secrets in browser

- Žiadne API kľúče v client-side JS
- `NEXT_PUBLIC_*` env vars sú **verejné** — používame iba pre URL-y (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SENTRY_DSN)
- Mux playback URLs generujeme vždy server-side (signed)

## Vulnerability disclosure

`SECURITY.md` v root repa popisuje, ako reportovať bezpečnostné chyby:

- Email: `security@clubup.sk` (nie GitHub Issue)
- PGP key (TODO: vygenerovať)
- 90-day responsible disclosure

## Penetration testing

**Pred ostrým spustením** (>= 100 aktívnych enrollmentov) plánujeme:

1. Vlastný internal pentest — automatizované nástroje (OWASP ZAP, Burp Suite Community)
2. Externý pentest — cez slovenskú/EU bezpečnostnú firmu

Frekvencia: ročne + po zásadnej zmene architektúry.

## Bezpečnostný checklist pred prod launch

- [ ] Všetky secrets v Vercel env, nie v repe
- [ ] CSP header aktívny a testovaný
- [ ] HTTPS enforced + HSTS
- [ ] SSO callback URLs whitelisted v auth.sportup.sk
- [ ] 24-pay webhook URL nastavený a testovaný
- [ ] Mux signed URLs validované
- [ ] Rate limiting aktívny na všetkých endpointoch
- [ ] Sentry s alertami pre security events
- [ ] Audit log testovaný (admin akcie sa zaznamenávajú)
- [ ] Backup recovery test (skutočne obnoviť z backupu na staging)
- [ ] DSAR flow testovaný
- [ ] Cookie banner zhodný s GDPR
- [ ] Penetration test report bez critical findings

## Incident response

Ak sa detekcia útoku alebo breach:

1. **Containment** — okamžite revokovať credentials, izolovať dotknutý komponent
2. **Notify** — Slack #clubup-security; pri SEV-1 SMS
3. **Investigate** — Sentry, audit logs, Vercel deployments
4. **Mitigate** — patch, rollback, scale, block IPs
5. **GDPR notification** — ak osobné údaje ovplyvnené, do 72h ÚOOÚ SR (viď [`gdpr.md`](gdpr.md))
6. **Post-mortem** — blameless, action items

Detaily incident response procesu v [`monitoring.md`](monitoring.md).
