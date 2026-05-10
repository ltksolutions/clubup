# ADR-0002: Monorepo s Turborepo

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack), ADR-0003 (hosting)

## Kontext

ClubUp má tri samostatné výstupy:

1. **Marketingový web** (`clubup.sk`) — verejný, statický
2. **Študentská aplikácia** (`app.clubup.sk`) — autentifikovaná, dynamická
3. **Admin aplikácia** (`admin.clubup.sk`) — autentifikovaná, dynamická

Plus zdieľaný kód:
- UI komponenty (shadcn/ui na vlastných tokenoch)
- Database access layer (MongoDB schémy + repository funkcie)
- Auth helpers (OIDC client, RBAC)
- Konfigurácia (TS, ESLint, Tailwind preset)

Otázka: **jeden repo alebo tri?**

## Zvažované možnosti

### Možnosť A — Tri samostatné repá (`clubup-web`, `clubup-app`, `clubup-admin`) + npm packagy
- **Pros:** úplná izolácia, jednoduchšie CI/CD per projekt, jednoduchšie governance.
- **Cons:** zdieľaný kód musí byť npm package (publish + version bump pre každú zmenu), refactoring naprieč projektami je bolestivý, **hlavne pre 1-osobový tím to znamená hodiny administratívy mesačne**.

### Možnosť B — Monorepo s Turborepo + npm workspaces
- **Pros:** jeden git history, atomic commity naprieč apps + packages, zdieľaný kód cez `workspace:*`, Turborepo cachuje builds, jednoduchá lokálna dev experience.
- **Cons:** všetky projekty sa nasadzujú spolu (čo môže byť aj výhoda — sync verzie), repo je väčšie.

### Možnosť C — Monorepo s Nx
- **Pros:** silnejší tooling než Turborepo, Module Federation podpora.
- **Cons:** strmšia learning curve, vlastný build orchestrator namiesto npm workspaces, **overkill pre náš objem**.

### Možnosť D — Monorepo s pnpm workspaces (bez Turborepo)
- **Pros:** najrýchlejšia inštalácia, najmenej miesta na disku.
- **Cons:** žiadny task graph / cache (musí sa dorobiť), `sportup.sk` používa npm — prepínanie na pnpm by zlomilo konzistentnosť.

## Rozhodnutie

**Monorepo s Turborepo + npm workspaces.**

Štruktúra:

```
src/
├── apps/
│   ├── app/          # app.clubup.sk (Next.js)
│   └── admin/        # admin.clubup.sk (Next.js)
└── packages/
    ├── ui/           # shadcn/ui design system
    ├── db/           # MongoDB schémy + repositories
    ├── auth/         # OIDC client + RBAC
    └── config/       # TS / ESLint / Tailwind preset

website/              # statický marketingový web (mimo workspaces)
docs/                 # dokumentácia
```

## Dôvody

1. **1-osobový tím** — administratívna réžia 3 repov by zožrala kapacitu, ktorú treba na produkt.
2. **Refactoring naprieč apps** — keď zmeníme `Course` schému v `packages/db`, hneď vidíme, kde to zlomí v `apps/app` a `apps/admin`. V troch repách by to bola séria PRs.
3. **Atomic deployment** — keď meníme API zmluvu, frontend ide spolu s backendom v jednom commite.
4. **Turborepo cache** — pri zmene v `packages/ui` sa rebuilduje len to, čo na ňom závisí; testy sa cachujú.
5. **Konzistentnosť so SportUp.sk** — sportup.sk je tiež monorepo (Turborepo + npm).
6. **Marketingový web mimo workspaces** — je statický, nemá `package.json` s deps, žije v `website/` a deployuje sa cez Vercel `outputDirectory: "website"` (definované v `vercel.json`).

## Dôsledky

### Pozitívne
- Jeden `npm install` na celý projekt
- Zdieľanie typov zo `packages/db` priamo do `apps/*` bez publish
- Jeden CI workflow pre všetko (`turbo run test`)
- Jednoduchšie code reviews (jeden PR pokrýva celú zmenu)

### Negatívne / kompromisy
- **Repo môže narásť** — pri 5+ apps + 10+ packages bude `npm install` pomalší. Riešenie: Turborepo remote cache (Vercel ho má zadarmo)
- **Všetko sa builduje s každým CI** — Turborepo cachuje, ale prvý beh je dlhý
- **Branch protection** musí byť granular — nie každý commit do `apps/admin` má re-deployovať aj `apps/app`. Vercel má per-app build conditions cez `vercel.json` a [Ignored Build Step](https://vercel.com/docs/projects/overview#ignored-build-step)

### Neutrálne
- Pôvodne plánovanú „migráciu marketingového webu z websupport.sk" robíme v rámci toho istého repa — `website/` je len ďalší priečinok

## Implementačné poznámky

- `package.json` na rooti má `"workspaces": ["src/apps/*", "src/packages/*"]`
- `turbo.json` definuje task graph (`build`, `dev`, `lint`, `test`, `typecheck`)
- Každá app má vlastný `vercel.json` s `"buildCommand"` a `"installCommand"` (cez Turborepo)
- `src/packages/config` exportuje shared TS/ESLint/Tailwind base configs

## Revisit

- **Ak sa tím rozšíri nad 5 ľudí** — možno bude treba rozdeliť práva per-app (CODEOWNERS riadky); monorepo to zvládne
- **Ak by sme chceli open-source-nuť len jednu časť** (napr. `packages/ui`) — potrebovali by sme submodule alebo split-repo nástroj (git-filter-repo)
- **Pri 50+ packages** — vyhodnotiť, či nie je čas prejsť na Nx s Module Federation

## Odkazy

- [Turborepo docs](https://turbo.build/repo/docs)
- [npm workspaces](https://docs.npmjs.com/cli/v10/using-npm/workspaces)
- [Vercel Monorepos guide](https://vercel.com/docs/monorepos)
