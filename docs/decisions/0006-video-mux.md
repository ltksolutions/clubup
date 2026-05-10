# ADR-0006: Video hosting na Mux

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack)

## Kontext

Veľká časť obsahu kurzov ClubUp sú **video lekcie** (odhadom 60–70 % obsahu, zvyšok je text + prezentácie + webináre + testy). Požiadavky:

- **Adaptive bitrate streaming** — študent na 4G v aute musí dostať rovnakú hodnotu ako študent na fiber
- **Signed URLs** s expiráciou — video nesmie byť stiahnuteľné cudzím (každý kus obsahu je platený)
- **Dôveryhodný uptime** — 99.9 %+ pre lekcie, ktoré študenti pozerajú aj o 23:00
- **Posters / thumbnails** automaticky generované
- **Captions / titulky** podpora (pre accessibility a SK lokalizáciu)
- **Player** ktorý sa pekne integruje s Next.js
- **Transcoding** zdrojového materiálu — lektor nahrá MP4, my dostaneme HLS
- **Cena** primeraná nášmu objemu

Rough odhad spotreby:
- 60 hodín obsahu × 500 študentov × 30 % priemerne pozretého = **9 000 hodín streamingu / rok** v 1. roku
- Pri 5 000 študentov: ~90 000 hodín

## Zvažované možnosti

### Možnosť A — Mux
- **Pros:** špecializovaná video infraštruktúra, automatický transcoding na HLS s adaptive bitrate, signed playback URLs, integrované Mux Data analytics, výborný React/Next.js integration (`@mux/mux-player-react`), pridaná podpora MP4 download a iné operácie
- **Cons:** **drahšie pri vysokom objeme** (~$0.005 / min sledovania); pri 90 000 hod = ~$27 000 / rok je to už neúnosné

### Možnosť B — Cloudflare Stream
- **Pros:** **dramaticky lacnejší pri scale** (~$1 / 1000 minút uložených, $1 / 1000 minút sledovaných), na rovnakej infraštruktúre ako CF CDN
- **Cons:** menej polished player, slabšie analytics, menej hotových React komponentov, novšia služba (menej referencií)

### Možnosť C — Self-host (S3 + CloudFront + custom HLS encoder)
- **Pros:** najlacnejšie pri ozaj veľkom objeme (~$0.002 / min)
- **Cons:** **musíme spravovať encoding pipeline** (FFmpeg, transcoding), monitoring, signed URLs, player, captions formats. Pre 1-osobový tím je to týždne práce navyše + ongoing údržba
- Mitigácia: použiť AWS MediaConvert, ale to je ďalší vendor s vlastnou krivkou učenia

### Možnosť D — YouTube unlisted
- **Pros:** zadarmo, najlepší player, automatické captions
- **Cons:** **nedá sa garantovať**, že video nebude unlisted YouTube náhodne odporúčaný cudzím (algoritmus); žiadne skutočné access control; YouTube môže video kedykoľvek odstrániť bez upozornenia (ak by AI prejudikoval); brand sa nezhoduje s plateným kurzom; **toto by bol UX disaster pre platený produkt**

### Možnosť E — Vimeo Pro / OTT
- **Pros:** zameraný na premium video, dobré access control, slovenská lokalizácia v UI
- **Cons:** drahší než Mux pri scale, slabší developer experience, menej moderný API

## Rozhodnutie

**Mux pre Fázu 1–3** (do ~5 000 študentov), s pripravenou migračnou cestou na **Cloudflare Stream** pre Fázu 4+.

Konkrétne:
- Lekcie typu `video` ukladajú `muxAssetId` a `muxPlaybackId` (viď [`../domain/lesson.md`](../domain/lesson.md))
- Player: `@mux/mux-player-react` v `packages/ui`
- Signed URLs cez Mux JWT (expirácia 6 h, viazané na user ID)
- Klient `packages/mux` enkapsuluje Mux API
- Captions vo VTT formáte ako Lesson `body.transcript` field; zobrazované v `<track>` elemente
- Pri prekročení ~3 000 študentov začneme paralelne uploadovat na Cloudflare Stream a otestujeme migráciu

## Dôvody

1. **Najrýchlejšie do prevádzky** — Mux má najlepší DX, vieme to mať live za pár dní
2. **Zrelé reactové komponenty** — `<MuxPlayer />` rieši HLS, posters, captions, theming, analytics jedným tagom
3. **Automatické transcoding** — admin nahrá raw MP4 cez Mux SDK, do pár minút je k dispozícii adaptive HLS so všetkými bitrate profile-mi
4. **Mux Data analytics** — vieme, kde študenti opúšťajú lekciu (keď je 80 % drop-off na minúte 3, treba prerobiť obsah)
5. **Kompatibilita s migráciou** — formát HLS je štandard, signed URLs sú JWT, takže prechod na Cloudflare Stream znamená re-upload a swap URL — nie zmenu architektúry

## Dôsledky

### Pozitívne
- Mobile-first UX (adaptive bitrate funguje na 4G aj WiFi)
- Žiadny vlastný encoding stack
- Transcripty + captions zabezpečujú accessibility (WCAG)
- Mux Data odhalí slabé miesta v obsahu
- DRM-lite cez signed URLs odrádza casual sťahovateľov (sofistikovaní vždy nájdu cestu, ale väčšina študentov nie sú piráti)

### Negatívne / kompromisy
- **Cena pri scale** — pri 5 000+ študentov sa cena Mux blíži k 1 000 € / mesiac len za video. Toto je dôvod plánu migrácie na CF Stream
  - Mitigácia 1: signed URLs s krátkou expiráciou (6 h) odradia distribuovanie odkazov
  - Mitigácia 2: HLS only (žiaden MP4 download), aby sa neúčtoval „download" tier
  - Mitigácia 3: Mux nárastovacie tiers — pri vyššom objeme sa cena na minútu znižuje
- **Lock-in na Mux URL štruktúru** — pri migrácii budeme musieť update-ovať `muxPlaybackId` na nové ID. Riešenie: abstraktná funkcia `getPlaybackUrl(lessonId)` vo `packages/mux`, ktorá interne vyberá provider podľa nového field `provider` na lekcii
- **Žiadny offline playback** — Mux neponúka offline downloads. Pre študentov, ktorí by chceli pozerať bez internetu (zriedkavé pre náš target), je to limitácia

### Neutrálne
- Mux servery sú v US a EU; pre slovenských užívateľov je latency cez EU edge < 50 ms

## Implementačné poznámky

- Mux **upload flow** v admin app:
  1. Admin klikne „Pridať video lekciu"
  2. Server Action vytvorí Direct Upload URL cez Mux API
  3. Browser uploaduje súbor priamo do Mux (nie cez náš server — žiadne bandwidth na Verceli)
  4. Webhook od Mux informuje, že asset je `ready` → uloží `muxAssetId` + `muxPlaybackId` do Lesson
  5. Generovanie posteru je automatické (Mux URL `https://image.mux.com/{playbackId}/thumbnail.jpg`)
- Signed URLs:
  - Generujeme on-demand cez `/api/lessons/[id]/playback-url`
  - JWT podpísaný cez Mux signing key
  - Expirácia 6 h
  - Volajúci musí mať aktívny `Enrollment` na rodičovskom kurze (overené v handlere)
- Captions v VTT formáte v `lesson.body.transcript`, browser ich renderuje cez `<track kind="captions" srclang="sk">`
- Environment vars: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_KEY_SECRET`

## Revisit

- **Pri prekročení 1 000 € / mesiac za Mux** — paralelne uploadovat na CF Stream, A/B testovať kvalitu, plán migrácie
- **Ak Mux zruší / zmení podmienky pre EU** — okamžite migrácia (typicky 1–2 týždne)
- **Pri DRM požiadavke** (FRI ŽU by chcela tvrdé DRM) — Mux má Premium plan s Widevine/PlayReady; alternatíva: nehostovať konkrétne premium materiály, len ich linkovať z webinárov

## Odkazy

- [Mux Pricing](https://www.mux.com/pricing)
- [Mux Direct Uploads](https://docs.mux.com/guides/upload-files-directly)
- [Mux Signed Playback URLs](https://docs.mux.com/guides/secure-video-playback)
- [Cloudflare Stream Pricing](https://developers.cloudflare.com/stream/pricing/)
- [`../domain/lesson.md`](../domain/lesson.md) — Lesson schema s Mux fields
