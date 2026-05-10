# ClubUp — Brand Assets

Vizuálna identita projektu **ClubUp.sk — Silné kluby. Silný šport.**
podľa ClubUp Design Manual v1.0 (2025).

> Otvorená vzdelávacia platforma pre manažment športových klubov na Slovensku.
> Súčasť ekosystému **SportUp.sk**.

---

## Pre koho je tento priečinok

| Profesia | Začni tu |
|---|---|
| **Vývojár** (frontend, mobil, e-mail šablóny) | [`tokens/`](#design-tokens) → [`logo/`](#logotyp) → `dev.html` (developer guide) |
| **Marketing** (kampane, reklamy, sociálne siete) | [`manual.html`](manual.html) (kompletný brand manuál) → [`logo/`](#logotyp) |
| **PR / komunikácia** (tlačové správy, mediálny kit) | [`manual.html`](manual.html) → [`logo/`](#logotyp) → verejný URL `https://clubup.sk/brand/` |
| **Externý partner** (klub, zväz, dodávateľ) | https://clubup.sk/brand/ → `logo/` (svg na stiahnutie) |

---

## Logotyp

ClubUp má **6 verzií loga** v jednom SVG formáte. Každá je optimalizovaná pre konkrétny kontext.

| Variant | Súbor | Použitie |
|---|---|---|
| **Primary** | [`logo/clubup-logo-primary.svg`](logo/clubup-logo-primary.svg) | Svetlé pozadie — základná verzia (web hero, dokumenty) |
| **Dark** | [`logo/clubup-logo-dark.svg`](logo/clubup-logo-dark.svg) | Tmavé / navy pozadie (admin nav, OG image) |
| **Mono Navy** | [`logo/clubup-logo-mono-navy.svg`](logo/clubup-logo-mono-navy.svg) | Jednofarebná navy — tlač, embossovanie |
| **Mono Black** | [`logo/clubup-logo-mono-black.svg`](logo/clubup-logo-mono-black.svg) | Jednofarebná čierna — fax, novinová tlač |
| **Mono White** | [`logo/clubup-logo-mono-white.svg`](logo/clubup-logo-mono-white.svg) | Jednofarebná biela — farebné/fotografické pozadia |
| **Original** | [`logo/clubup-logo-original.svg`](logo/clubup-logo-original.svg) | Master / zdrojové SVG (pre dizajnérov) |

**Pomer strán:** 2.35 : 1 (1719 × 732 px). Pri škálovaní vždy zachovávajte pomer strán.

**Minimálne veľkosti:**
- Tlač: min. šírka **30 mm**
- Digitál: min. šírka **120 px**

**Ochranná zóna:** voľný priestor okolo loga rovný minimálne výške písmena „U" z loga.

Detailné pravidlá viď [`manual.html`](manual.html) (10-stranový A4 brand manuál v print-ready formáte).

---

## Farby

### Primárne

| Farba | HEX | RGB | Použitie |
|---|---|---|---|
| **ClubUp Navy** | `#1A2D47` | 26, 45, 71 | Primárna značková farba, headers, navigácia |
| **ClubUp Navy 2** | `#243A5A` | 36, 58, 90 | Sekundárna navy, hover stavy |
| **ClubUp Blue** | `#388FC3` | 56, 143, 195 | Akcent, linky, focus, CTA tlačidlá |
| **ClubUp Blue 2** | `#5BA8D6` | 91, 168, 214 | Hover variant blue |
| **ClubUp Pale** | `#E8F4FD` | 232, 244, 253 | Tinted surface, chips, badges |

### Neutrálne

| Farba | HEX | Použitie |
|---|---|---|
| **Ink** | `#0E1320` | Default text |
| **Gray** | `#8E8E92` | Muted text, captions, slogan |
| **Line** | `#E2E5EA` | Borders, dividers |
| **BG** | `#F4F6F8` | Page background |
| **Warm** | `#FAFAF7` | Alt warm surface |
| **Paper** | `#FFFFFF` | Cards, modals |

### Sémantické

| Farba | HEX | Použitie |
|---|---|---|
| **Success** | `#2E8B57` | Úspešné stavy, dokončené kurzy |
| **Warning** | `#E0A33E` | Upozornenia, blížiaci sa deadline |
| **Danger** | `#C8453B` | Chyby, refundované platby |

### Pomer použitia

V brand komunikácii: **Navy 55% · Blue 30% · biela/neutrálna 15%**.

---

## Typografia

**Primárne písmo:** [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts) — bezpätkové.

**Mono písmo:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — pre kód, technické údaje, HEX hodnoty.

**Slogan a kurzíva:** Poppins Italic 500/700.

### Hierarchia veľkostí

| Token | Veľkosť | Použitie |
|---|---|---|
| `--clubup-fs-h1` | 44 px | Hlavný nadpis stránky |
| `--clubup-fs-h2` | 28 px | Podnadpis, sekcia |
| `--clubup-fs-h3` | 18 px | Subsekcia |
| `--clubup-fs-body` | 14 px | Bežný text |
| `--clubup-fs-small` | 12 px | Caption, popisy |
| `--clubup-fs-mono` | 12 px | Technické údaje |

---

## Design tokens

Pre vývojárov sú v [`tokens/`](tokens/) tri formáty toho istého:

| Súbor | Pre čo |
|---|---|
| [`tokens/clubup-tokens.css`](tokens/clubup-tokens.css) | Globálne CSS premenné — drop do `globals.css` / `app.css` |
| [`tokens/clubup-tokens.json`](tokens/clubup-tokens.json) | [Design Tokens Format](https://design-tokens.github.io/community-group/format/) — pre Style Dictionary, Token Studio (Figma), generátory |
| [`tokens/tailwind.config.js`](tokens/tailwind.config.js) | Tailwind preset — `presets: [require('./brand/tokens/tailwind.config.js')]` |

### Použitie — Next.js / React

**globals.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300..800;1,400..700&family=JetBrains+Mono:wght@400;500&display=swap');
@import './brand/tokens/clubup-tokens.css';
```

**Tailwind:**
```js
// tailwind.config.ts
import clubup from './brand/tokens/tailwind.config.js';

export default {
  presets: [clubup],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
};
```

Dostupné triedy: `bg-clubup-navy`, `text-clubup-blue`, `shadow-clubup-card` atď.

### Použitie — vanilla / e-mail šablóny

```html
<style>
  @import url('https://clubup.sk/brand/tokens/clubup-tokens.css');
  body { background: var(--clubup-bg); color: var(--clubup-ink); }
  .btn { background: var(--clubup-blue); color: #fff; padding: 12px 24px; border-radius: 8px; }
</style>
```

---

## Spacing & layout

8-bodový spacing scale: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px`.

Border radius: `xs 4 · sm 6 · md 8 · lg 12 · xl 16 · full 9999`.

Detaily v `clubup-tokens.css` pod `--clubup-space-*` a `--clubup-radius-*`.

---

## HTML preview / Brand Hub

Po nasadení na Vercel sú tieto stránky verejne dostupné na `https://clubup.sk/brand/`:

| URL | Popis |
|---|---|
| [`index.html`](index.html) | **Brand Hub** — landing pre celý brand kit |
| [`manual.html`](manual.html) | **Brand Manual** — kompletné pravidlá značky (10 strán A4, print-ready) |
| [`logo.html`](logo.html) | **Logo Showcase** — všetky varianty interaktívne |
| [`icons.html`](icons.html) | **Icon Showcase** — ikon set s SVG copy-to-clipboard |
| [`dev.html`](dev.html) | **Developer Guide** — pre vývojárov, copy-paste snippety |

> **Print-ready PDF** brand manuálu sa generuje z `manual.html` cez prehliadač (Cmd/Ctrl + P → Save as PDF). HTML obsahuje `@media print` štýly a A4 layout.

---

## Pre marketing & PR — verejný mediálny kit

Po nasadení sú všetky logá v SVG **verejne stiahnuteľné**. Pre tlačové správy, kampane partnerov, dotácie atď. odkazujeme na:

```
https://clubup.sk/brand/
├── manual.html                            ← úplný brand manuál (otvoriť v prehliadači)
└── logo/
    ├── clubup-logo-primary.svg            ← najčastejšie použitie
    ├── clubup-logo-dark.svg               ← pre tmavé pozadia
    └── clubup-logo-mono-*.svg             ← jednofarebné varianty
```

**Vzorka tlačovej správy** s correct attribution:

> ClubUp.sk — vzdelávacia platforma pre manažment športových klubov.
> Logo a brand assety: https://clubup.sk/brand/
> Brand manuál: https://clubup.sk/brand/manual.html
> Kontakt: info@clubup.sk

---

## Použitie v ekosystéme SportUp

ClubUp je súčasťou ekosystému SportUp.sk. Pri spoločnej komunikácii:

- **Logá vedľa seba**: ClubUp logo má **rovnakú výšku** ako SportUp logo, oddelené minimálne 24 px.
- **Sponzorované formáty** (kurzy financované cez ŠFP, ministerstvo): SportUp logo + ClubUp logo + logo poskytovateľa, v pomere 1:1:1.
- **Co-branding s Žilinskou univerzitou** (akreditovaný partner certifikácie): ClubUp logo + logo ŽU/FRI v pomere 1:1.

---

## Zdroje a vlastníctvo

- **Vlastník značky:** Ján Letko / LTK Solutions s.r.o.
- **Licencia logu:** © ClubUp 2025 — všetky práva vyhradené. Použitie v médiách s atribúciou je povolené.
- **Licencia tokenov a kódu** v tomto adresári: CC-BY-4.0 (rovnako ako zvyšok dokumentácie repa)
- **Kontakt pre brand otázky:** info@clubup.sk

---

## Verzionovanie

| Verzia | Dátum | Zmeny |
|---|---|---|
| 1.0 | 2025-Q4 | Iniciálny brand kit, 6 variantov loga, design tokens v3 formátoch |

Pri zmenách brand štandardov:
1. Vytvor PR s úpravou tokenov + ukážkou v `manual.html`
2. Bumpni verziu v tomto README
3. Notifikuj všetky aplikácie v ekosystéme (sportup.sk, activity.sportup.sk)
