# Public assets

Statické súbory pre dokumentačnú stránku `docs.clubup.sk`.

| Súbor | Zdroj | Použitie |
|---|---|---|
| `logo.svg` | `website/brand/logo/clubup-logo-mono-white.svg` | Logo v navbare (biele, vhodné na navy pozadie) |
| `favicon.svg` | `website/favicon/cu-icon.svg` | Favicon (CU monogram na navy pozadí) |

## Synchronizácia s marketingovým webom

Keď sa zmenia primárne brand assety v `website/brand/` alebo `website/favicon/`,
prekopíruj príslušné súbory aj sem. (Nemá to symlink, lebo Vercel nezaručuje
zachovanie symlinkov medzi workspace-mi pri build-e.)

## PNG variants

Pre PWA ikony (`icon-192.png`, `apple-touch-icon.png`) viď
[`../../../../website/favicon/README.md`](../../../../website/favicon/README.md).
Pre dokumentačnú stránku v0.1 stačí SVG favicon — všetky moderné prehliadače ho
zvládnu, vrátane Safari 18+ na macOS a iOS.
