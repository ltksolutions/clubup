# High-level architektúra

## Celkový pohľad

```mermaid
flowchart TB
    subgraph User["Užívatelia"]
        Visitor[Návštevník webu]
        Student[Študent]
        Admin[Admin / Lektor]
    end

    subgraph Vercel["Vercel hosting"]
        Web[clubup.sk<br/>Marketing<br/>statický web]
        App[app.clubup.sk<br/>Next.js 15<br/>Študentská aplikácia]
        AdminApp[admin.clubup.sk<br/>Next.js 15<br/>Admin aplikácia]
    end

    subgraph SportUp["SportUp.sk ekosystém"]
        Auth[auth.sportup.sk<br/>OIDC issuer]
        Registry[api.sportup.sk<br/>Centrálny register]
    end

    subgraph External["Externé služby"]
        Mongo[(MongoDB Atlas<br/>course/enrollment/<br/>order/progress)]
        Mux[Mux<br/>video streaming]
        Pay[24-pay.sk<br/>platobná brána]
        Teams[Microsoft Teams<br/>live webináre]
        Email[Resend<br/>transakčné emaily]
    end

    Visitor --> Web
    Student --> App
    Admin --> AdminApp

    App -- OIDC login --> Auth
    AdminApp -- OIDC login --> Auth
    Auth -- person data --> App
    Auth -- person data --> AdminApp

    App -- read person/org --> Registry
    AdminApp -- read person/org --> Registry

    App --> Mongo
    AdminApp --> Mongo

    App -- HLS player --> Mux
    AdminApp -- upload --> Mux

    App -- create order --> Pay
    Pay -- webhook --> App

    AdminApp -- send invite --> Teams
    App -- attend webinar --> Teams

    App -- send email --> Email
    AdminApp -- send email --> Email
```

## Tok dát: kúpa kurzu

Príklad „happy path" toku, keď študent kúpi kurz:

```mermaid
sequenceDiagram
    participant S as Študent (browser)
    participant App as app.clubup.sk
    participant Auth as auth.sportup.sk
    participant Reg as api.sportup.sk
    participant DB as MongoDB
    participant Pay as 24-pay
    participant Email as Resend

    S->>App: Klik "Kúpiť kurz"
    App->>Auth: redirect na /authorize (ak nie je session)
    Auth->>S: prihlasovacia obrazovka
    S->>Auth: prihlásenie
    Auth->>App: redirect s code
    App->>Auth: POST /token (code → access_token + id_token)
    Auth->>App: tokens
    App->>Reg: GET /persons/{sportup_person_id}
    Reg->>App: údaje osoby (meno, email, IČO ak FO/PO)
    App->>DB: insert Order(state=pending)
    App->>Pay: POST /payment (HMAC-podpísaný request)
    Pay->>App: redirect URL
    App->>S: redirect na 24-pay
    S->>Pay: zadáva kartu / vyberie banku
    Pay->>S: redirect späť na app.clubup.sk/orders/{id}/return
    Pay-->>App: webhook POST /api/webhooks/24pay (asynchrónne)
    App->>App: verifikácia HMAC
    App->>DB: update Order(state=paid)
    App->>DB: insert Enrollment
    App->>Email: pošli "Vitaj v kurze"
    App->>S: zobraz "Kurz je teraz prístupný"
```

Detaily HMAC podpisu a webhook handlera v [`../payments/integration.md`](../payments/integration.md).

## Vrstvy

```
┌──────────────────────────────────────────────────────┐
│  UI Layer (apps/app, apps/admin)                     │
│  Server Components + Client Components               │
│  Forms, lists, players, dashboards                   │
└──────────────────────────────────────────────────────┘
                          ▲
                          │ Server Actions / Route Handlers
                          ▼
┌──────────────────────────────────────────────────────┐
│  Application Services                                │
│  enrollment-service, payment-service,                │
│  certificate-service, progress-service               │
└──────────────────────────────────────────────────────┘
              ▲                ▲                  ▲
              │                │                  │
              ▼                ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  packages/db     │  │  packages/auth   │  │  External APIs   │
│  Mongo + Zod     │  │  OIDC client     │  │  24-pay, Mux,    │
│  repositories    │  │  + RBAC helpers  │  │  Teams, Resend,  │
│                  │  │                  │  │  SportUp Registry│
└──────────────────┘  └──────────────────┘  └──────────────────┘
              ▲
              │
              ▼
       ┌──────────────┐
       │ MongoDB Atlas│
       └──────────────┘
```

## Multi-tenancy

ClubUp **nie je multi-tenant** v zmysle „každá organizácia má svoj subdomain a izolované dáta". Všetky dáta sú v jednej databáze. Organizácia (klub, zväz) sa objavuje ako:

- **Sponzor enrollmentu** — keď klub kúpi kurz pre 5 svojich ľudí (`Order.org_sponsor_id`)
- **Príjemca faktúry** — fakturujeme na klub, nie na študenta
- **Štatistický rez** — admin vie vidieť „Koľko ľudí z klubu Spartak má kurz dokončený"

Toto stačí pre Fázy 1–4. Ak by sme niekedy potrebovali izolované dáta (napr. súkromný kurz pre konkrétny zväz s vlastným obsahom), riešili by sme to cez `tenant_id` na úrovni `Course` a filter v repository vrstve. Zatiaľ to nepotrebujeme.

## Idempotencia

Všetky mutácie, ktoré závisia od externých služieb (24-pay webhook, Mux upload callback), sú idempotentné cez `idempotency_key` v MongoDB s unique indexom. Detaily v [`../payments/integration.md`](../payments/integration.md).

## Observability

- **Logy:** Vercel Logs (každý request, výstup `console.*`)
- **Errors:** Sentry (napojené v `instrumentation.ts`)
- **Performance:** Vercel Analytics + Speed Insights
- **Custom metrics:** počet enrollmentov, dokončených kurzov, prerušených platieb — vlastný dashboard v admin aplikácii
- **Audit trail:** `audit_logs` kolekcia v Mongo pre platby a admin akcie

Detaily v [`../operations/monitoring.md`](../operations/monitoring.md).
