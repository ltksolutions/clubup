# ADR-0007: Live výučba cez Microsoft Teams

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0006 (video on-demand)

## Kontext

Časť kurzu „Športový manažment pre silnejšie kluby" sú **live webináre** (Q&A s lektormi, prípadové štúdie, panelové diskusie). Požiadavky:

- **50–200 účastníkov** na webinár (môže byť aj viac pri populárnych témach)
- **Interakcia** — chat, Q&A, raise hand
- **Nahrávanie** — záznam dostupný post-event ako lekcia
- **Kalendárová integrácia** — pozvánka v `.ics` formáte do Outlook / Google Calendar / Apple Calendar
- **Slovensky-friendly** — Slováci tieto nástroje musia poznať
- **Žiadne ďalšie účty** — študent by nemal musieť robiť ďalšiu registráciu
- **Stabilná infraštruktúra** — žiadny Zoom-bombing, žiadne výpadky

Dôležitý kontext: **Žilinská univerzita (akreditovaný partner certifikácie) používa M365 / Teams** ako oficiálny platformu pre online výučbu. Lektori webinárov budú prevažne z FRI ŽU.

## Zvažované možnosti

### Možnosť A — Microsoft Teams Meetings
- **Pros:** štandard v slovenských univerzitách a firmách, free Teams account stačí pre účastníka, podporuje 1 000+ účastníkov v jednom meetingu, nahrávky sa ukladajú do OneDrive/SharePoint, attendance reports cez Microsoft Graph API
- **Cons:** Microsoft ekosystém (vendor lock-in), nahrávky sú v M365 cloud — treba ich potom presunúť k nám pre on-demand prehrávanie

### Možnosť B — Zoom Meetings/Webinars
- **Pros:** najlepší UX, najpopulárnejší v US, zrelé API, robustný embed SDK
- **Cons:** **Zoom-bombing risiko** ak nie je dobre nakonfigurovaný, slovenské školy ho po roku 2020 začali opúšťať v prospech Teams, kvôli lokalizácii v slovenčine je Zoom horší než Teams

### Možnosť C — Google Meet
- **Pros:** zadarmo pre účastníkov s Google účtom, integrovaný s Calendar
- **Cons:** v slovenskom corporate prostredí menej rozšírený, slabšie webinar features (žiadne registration forms, slabšie attendance reports), často je blokovaný v school networkoch

### Možnosť D — Vlastný stream (Daily.co / LiveKit / mux Live)
- **Pros:** plne integrované do `app.clubup.sk`, jeden login, kontrola UX
- **Cons:** **drahé** pri scale (~$0.004 / minute / participant; pri 200 ľudí × 90 min = $72 za jeden webinár), strmá implementačná krivka, monitoring / SRE responsabilita

### Možnosť E — Jitsi Meet (self-hosted)
- **Pros:** open-source, žiadny vendor, plná kontrola
- **Cons:** musíme spravovať vlastnú infraštruktúru (TURN/STUN servery, scaling), kvalita pri 100+ účastníkov je problematická bez serious infraštruktúry

## Rozhodnutie

**Microsoft Teams Meetings ako platform pre live webináre.**

- Webinár je entita v ClubUp DB (viď [`../domain/webinar.md`](../domain/webinar.md))
- Admin v ClubUp UI vytvorí Webinar; backend cez Microsoft Graph API vytvorí Teams meeting a uloží `joinUrl`
- Pozvánka sa posiela emailom s `.ics` prílohou + `joinUrl`
- Po skončení webinára:
  - Admin manuálne stiahne nahrávku z OneDrive/SharePoint (Fáza 1)
  - Admin uploadne nahrávku do Mux ako on-demand video (viď ADR-0006)
  - Lekcia v rovnakom module dostane `recordingPlaybackId`
  - V neskoršej fáze automatizujeme cez Microsoft Graph webhooks + Mux Direct Uploads

## Dôvody

1. **Žilinská univerzita ho používa** — lektori sú z FRI ŽU, Teams je ich denný nástroj. Prechod na Zoom by ich vyrušil
2. **Slováci to poznajú** — Teams je v slovenských firmách aj školách bežný; študent klikne, otvorí sa app/web, prihlási sa Microsoft účtom alebo ako hosť
3. **Zadarmo pre účastníkov** — Teams meetings nepotrebujú platený Microsoft 365 účet pre hosťa
4. **Robustné voči veľkým counts** — 200 účastníkov nie je problém; **1 000** je v rámci limitov; pri dosiahnutí 10 000+ vie ŽU zariadiť Premium licenciu cez svoju M365 zmluvu
5. **Attendance reports** — Microsoft Graph API vráti zoznam účastníkov + minúty pripojenia; toto použijeme pre `Progress.completedLessons` (študent získa kredit za webinár, ak bol pripojený ≥ 50 % trvania)
6. **Žiadny dual-record** — keď ŽU nahráva, my preberáme. Žiadne licenčné komplikácie

## Dôsledky

### Pozitívne
- Lektori používajú nástroj, ktorý poznajú
- Zero-friction pre študenta (klik na URL → join)
- Záznam sa dá použiť aj pre študentov, ktorí sa nemohli zúčastniť live
- Attendance reports automatizujú progress tracking

### Negatívne / kompromisy
- **Vendor lock-in na Microsoft** — ale je to limitované len na webinárny modul; ak by sme niekedy chceli prejsť, zmeníme `packages/teams` na iný provider
- **Manuálny upload nahrávok do Mux v Fáze 1** — admin musí preniesť súbor z OneDrive do Mux. Pri 1–2 webinároch / mesiac je to znesiteľné; pri 10+ mesačne to automatizujeme cez MS Graph webhooks
- **M365 aplikačný účet** — potrebujeme service principal v Microsoft Entra (Azure AD) na to, aby Microsoft Graph API mohlo vytvárať meetings v mene ClubUp
  - Mitigácia: Setup je raz, ale vyžaduje koordináciu s admin Microsoft 365 organizácie (LTK Solutions má svoje M365 tenant)
- **Captions / titulky pre záznam** — Teams má auto-captions po anglicky / česky, slovenčina je horšie. Po uploade do Mux je možné editovať a nahrávať vlastné VTT
- **Recording delay** — záznam sa v M365 ukáže s 10–30 min oneskorením po skončení webinára. Pre študentov to znamená, že hneď po webinári v ich timeline ešte nie je on-demand verzia

### Neutrálne
- Webinár sa dá nahrávať aj keď lektor použije OBS na vlastnú kameru → video v lepšej kvalite (ak by to chcel)

## Implementačné poznámky

- Microsoft Graph API endpoint pre vytvorenie meetingu:
  ```
  POST https://graph.microsoft.com/v1.0/users/{aplikacny-ucet}/onlineMeetings
  Body: {
    "subject": "ClubUp webinár: ...",
    "startDateTime": "2026-11-15T18:00:00Z",
    "endDateTime": "2026-11-15T19:30:00Z",
    "lobbyBypassSettings": { "scope": "everyone", "isDialInBypassEnabled": false },
    "allowedPresenters": "organizer"
  }
  ```
- App registration v Microsoft Entra:
  - Type: confidential client (server-to-server)
  - Permissions: `OnlineMeetings.ReadWrite.All`, `OnlineMeetingArtifact.Read.All`, `OnlineMeetingRecording.Read.All`
  - Auth: client credentials flow (žiadny user delegated)
- `.ics` generátor v `packages/email` (alebo `packages/teams`)
- Webinar entity attendees — `WebinarRSVP` collection (viď [`../domain/webinar.md`](../domain/webinar.md))
- Environment vars:
  - `MS_GRAPH_TENANT_ID`
  - `MS_GRAPH_CLIENT_ID`
  - `MS_GRAPH_CLIENT_SECRET`
  - `MS_GRAPH_USER_ID` (aplikačný účet pre vytváranie meetingov)

## Revisit

- **Pri 50+ webinároch / mesiac** — automatizovať recording → Mux upload pipeline cez MS Graph webhooks (`onlineMeetingRecording` notifications)
- **Ak ŽU prejde na inú platformu** (napr. BigBlueButton self-hosted) — re-evaluovať
- **Ak budeme chcieť priame embed** webinára do `app.clubup.sk` (študent neopúšťa našu app) — Microsoft Live Events SDK alebo prepnutie na vlastný stream

## Odkazy

- [Microsoft Graph - Online meetings](https://learn.microsoft.com/en-us/graph/api/resources/onlinemeeting)
- [Microsoft Graph - Attendance reports](https://learn.microsoft.com/en-us/graph/api/resources/meetingattendancereport)
- [`../domain/webinar.md`](../domain/webinar.md) — Webinar entity
