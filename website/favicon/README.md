# Favicon assets

ClubUp favicon a PWA ikony.

## Súbory

| Súbor | Veľkosť | Popis |
|---|---|---|
| `cu-icon.svg` | viewBox 64×64 | Hlavná SVG ikona — CU monogram na navy pozadí |
| `icon-192.png` | 192×192 | PWA ikona pre Android |
| `icon-512.png` | 512×512 | PWA ikona pre Android, splash screen |
| `apple-touch-icon.png` | 180×180 | iOS home screen ikona |
| `favicon.ico` | 16×16, 32×32, 48×48 multi-size | Tradičný favicon (legacy browsers) |

## Generovanie PNG variants z SVG

PNG súbory zatiaľ chýbajú — vygenerujte ich z `cu-icon.svg`:

### Možnosť 1 — Online nástroj

Použite [realfavicongenerator.net](https://realfavicongenerator.net/) — nahrajte `cu-icon.svg`,
nastavte **iOS background** = `#1A2D47`, **Android theme color** = `#1A2D47`, exportujte balíček.

### Možnosť 2 — ImageMagick / rsvg-convert

```bash
# 192×192
rsvg-convert -w 192 -h 192 cu-icon.svg > icon-192.png

# 512×512
rsvg-convert -w 512 -h 512 cu-icon.svg > icon-512.png

# 180×180 Apple
rsvg-convert -w 180 -h 180 cu-icon.svg > apple-touch-icon.png

# Multi-size ICO
convert cu-icon.svg -define icon:auto-resize=16,32,48 favicon.ico
```

### Možnosť 3 — Node.js sharp

```js
import sharp from 'sharp';

const svg = await fs.readFile('cu-icon.svg');

await sharp(svg).resize(192, 192).png().toFile('icon-192.png');
await sharp(svg).resize(512, 512).png().toFile('icon-512.png');
await sharp(svg).resize(180, 180).png().toFile('apple-touch-icon.png');
```

## Použitie v HTML

Aktuálne HTML súbory v `website/` referencujú **SVG ikonu priamo z `brand/logo/`**:

```html
<link rel="icon" href="brand/logo/clubup-logo-primary.svg" type="image/svg+xml">
```

Pre maximálnu kompatibilitu (vrátane starších prehliadačov a iOS) doplňte do `<head>`:

```html
<link rel="icon" href="favicon/cu-icon.svg" type="image/svg+xml">
<link rel="icon" href="favicon/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
```

## Brand referencie

Kompletný brand kit s logami, farbami a typografiou: `../brand/index.html`.
