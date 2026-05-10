# Bezpečnostná architektúra

## Princípy

### Zero-trust

Každý request je autentifikovaný (kto), autorizovaný (čo môže) a auditovaný (zaznamenaný). Žiadne implicitné dôveryhodné zóny — ani interná sieť, ani prihlásený admin.

### Žiadne sekrety v kóde

- Sekrety sú len v environment variables na Verceli
- `.env.local` v `.gitignore`
- REUSE compliance check + GitHub secret scanning na každom PR
- Žiadne API keys, OIDC client_secret, MongoDB connection string ani 24-pay merchant secret v repe

### Identita je delegovaná

ClubUp **nemá vlastné heslá**. Všetky prihlásenia idú cez `auth.sportup.sk`. Toto má bezpečnostné výhody:

- Žiadne riziko leaknutej password databázy
- 2FA je riadené centrálne v SportUp
- Session expiry, refresh, sign-out — všetko centrálne
- Compliance s GDPR Purpose Catalogue centralizovaná

## Vrstvy obrany

```
┌────────────────────────────────────────────────────┐
│ 1. Network                                         │
│    HTTPS only, TLS 1.3, HSTS preload, IPv6         │
│    DDoS ochrana cez Vercel/Cloudflare              │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 2. WAF / Rate limiting                             │
│    Vercel + Upstash Ratelimit                      │
│    public endpoints: 20/min/IP                     │
│    auth: 5 pokusov / 5 min / IP                    │
│    payments: 3 pokusy / hour / user                │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 3. Authentication                                  │
│    OIDC cez auth.sportup.sk                        │
│    JWT s krátkou expiráciou (15 min) + refresh     │
│    Refresh token rotation, replay detection        │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 4. Authorization (RBAC)                            │
│    requireRole() na každej server akcii            │
│    role-based vs resource-based oprávnenia         │
│    explicit permissions, nie deny-list             │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 5. Validation                                      │
│    Zod schémy na vstupe každej akcie               │
│    Whitelist polí pri update                       │
│    Bezpečné MongoDB query (no $where, no eval)     │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 6. Data                                            │
│    MongoDB Atlas: encryption at rest               │
│    Citlivé polia (IČO/DIČ pre faktúry) šifrované   │
│    Backup denne, retention 30 dní                  │
│    Field-level redaction v logoch                  │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│ 7. Audit                                           │
│    audit_logs kolekcia, immutable                  │
│    sentry.captureMessage pre podozrivé akcie       │
│    daily review podozrivých záznamov               │
└────────────────────────────────────────────────────┘
```

## Threat model

### 1. Cudzí návštevník vidí cudzie kurzy

**Riziko:** Návštevník stránky `/objednavky/{id}` vidí cudzú objednávku.

**Mitigácia:**
- Server Component načíta order a kontroluje `order.studentId === session.user.sportupPersonId`
- Ak nesúhlasí → 404 (nie 403, aby sme nepotvrdili existenciu)
- Audit log o pokuse

### 2. Admin endpoint volá študent

**Riziko:** `/api/courses/{id}/publish` zavolá študent priamo cez fetch.

**Mitigácia:**
- `requireRole('admin')` v každom admin endpointe
- Failure → 403 + audit log
- Pre kritické akcie (delete course, refund payment) **2-step confirmation** v UI

### 3. Replayed webhook od 24-pay

**Riziko:** Útočník zachytí webhook a opakovane ho posiela, čím študentovi udeľuje prístup k mnohým kurzom.

**Mitigácia:**
- HMAC-SHA256 verifikácia každého webhooku (24-pay shared secret)
- `event_id` je unique v `webhook_events` kolekcii — replay skončí na duplicate key error
- Stará timestamp v evente (>5 min) je odmietnutý

### 4. Účet ukradnutý

**Riziko:** Útočník získa session token a kupuje kurzy z účtu obete.

**Mitigácia:**
- Krátky access token (15 min)
- Refresh token rotation s replay detection (ak prídu 2 requesty s rovnakým refresh, account lock)
- Pri novej IP/device → email "Prihlásenie z novej polohy"
- Možnosť „Odhlásiť všetky zariadenia" v profile

### 5. Útočník vyrobí fake certifikát

**Riziko:** Útočník upraví PDF certifikátu a tvrdí, že má kvalifikáciu.

**Mitigácia:**
- Každý certifikát má `registration_number` registrovaný u Žilinskej univerzity
- Verejný `/verify/{registration_number}` endpoint, ktorý vráti meno + dátum + hash
- PDF má digitálny podpis ŽU

### 6. SQL/NoSQL injection

**Riziko:** Útočník v query parametri vloží MongoDB operátor (napr. `?slug[$ne]=null`).

**Mitigácia:**
- Všetky vstupy idú cez Zod, ktorý očakáva `z.string()` pre slug
- Žiadne `$where`, `$function` v queries
- Body parser kontroluje typ JSON tela

### 7. CSRF

**Riziko:** Cudzia stránka pošle POST na náš server cez cookie session.

**Mitigácia:**
- Server Actions majú built-in CSRF protection v Next.js (origin check)
- Cookies sú `SameSite=Lax`, `Secure`, `HttpOnly`
- Pre custom Route Handlers manuálne overujeme `Origin` header

### 8. XSS

**Riziko:** Útočník v texte lekcie (Markdown) vloží `<script>`.

**Mitigácia:**
- Markdown rendering cez `remark` + `rehype-sanitize` s whitelistom tagov
- CSP header nastavený na strict (no inline scripts okrem nonce)
- React natívne escape-uje text

### 9. Data exfiltration cez admin

**Riziko:** Bývalý admin si stiahne celú DB pred odchodom.

**Mitigácia:**
- Admin nemôže exportovať raw dáta cez UI (len agregované štatistiky)
- DB prístup len na úrovni MongoDB Atlas role, ktorá sa pri odchode revoke-uje
- Audit log o všetkých DB queries z admin aplikácie

## Secrets management

| Secret | Kde žije | Ako sa rotuje |
|---|---|---|
| `MONGODB_URI` | Vercel env | DB heslo cez Atlas, manual rotation Q1/Q3 |
| `SPORTUP_OIDC_CLIENT_SECRET` | Vercel env | regenerácia v `auth.sportup.sk` admin |
| `PAYMENT_24PAY_SECRET` | Vercel env | regenerácia v 24-pay merchant portál |
| `MUX_TOKEN_SECRET` | Vercel env | regenerácia v Mux dashboard |
| `RESEND_API_KEY` | Vercel env | regenerácia v Resend dashboard |
| `SENTRY_DSN` | Vercel env | nie je sensitive (verejný DSN) |
| `INNGEST_SIGNING_KEY` | Vercel env | regenerácia v Inngest |

Pre dev používame `.env.local` so samostatnými dev kredenciálmi (Atlas dev cluster, Mux test mode, 24-pay test merchant).

## Compliance

- **GDPR** — detaily v [`../operations/gdpr.md`](../operations/gdpr.md)
- **PCI DSS** — neukladáme čísla kariet, 24-pay je certifikovaný provider
- **NIS2 / Zákon o kybernetickej bezpečnosti** — ClubUp nie je „základná služba" podľa NIS2, ale dodržiavame princípy (incident response, security testing)
- **eIDAS** — pre digitálne podpisované certifikáty od ŽU (rieši ŽU, nie my)

## Penetračné testy

Plánované po nasadení Fázy 3 (študentská aplikácia s platbami). Skopuje:

- OWASP Top 10
- Auth flow (token replay, fixation, refresh hijack)
- Payment flow (race conditions, double-spending, replay)
- Admin endpoint enumeration
- Storage security (MongoDB Atlas IAM)

## Incident response

Pri bezpečnostnom incidente:

1. **Detect** — alert zo Sentry, audit anomálie, externé hlásenie cez `info@clubup.sk`
2. **Contain** — disable affected service / revoke compromised credentials
3. **Eradicate** — fix the vulnerability
4. **Recover** — re-enable service
5. **Lessons learned** — postmortem v `docs/operations/incidents/` (anonymizovaný, ak relevantné)

Plus: notifikácia ÚOOÚ do 72 hodín, ak ide o únik osobných údajov.
