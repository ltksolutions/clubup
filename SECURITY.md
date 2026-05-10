# Security Policy

## Hlásenie zraniteľností

Bezpečnosť osobných údajov študentov a obsahu vzdelávania je pre nás zásadná. Ak nájdete zraniteľnosť, prosíme:

### Čo robiť

- **Pošlite e-mail na `info@clubup.sk`** s detailmi
- V predmete uveďte `[SECURITY]` na začiatku
- Popíšte zraniteľnosť, dôsledky a (ak možno) reprodukciu
- Ak chcete, môžete e-mail zašifrovať PGP kľúčom (kľúč bude pridaný v ďalšej verzii tohto dokumentu)

### Čo NErobiť

- **Neotvárajte verejné Issue** s detailmi zraniteľnosti
- Nepublikujte detaily na sociálnych sieťach pred fixom
- Nezneužívajte zraniteľnosť na získanie cudzích dát alebo prístupu ku kurzom

## Naše záväzky

- **Potvrdíme prijatie** do 48 hodín
- **Predbežnú odpoveď** s odhadom závažnosti dáme do 7 kalendárnych dní
- **Komunikujeme priebeh** opravy a očakávané vydanie fixu
- **Po fixe vás uvedieme** v Acknowledgments (ak si želáte) v release notes

## Disclosure timeline

Praktizujeme **coordinated disclosure**:

1. Hlásenie nahlásené súkromne
2. Preverenie a oprava (typicky 30–90 dní podľa závažnosti)
3. Patch nasadený
4. Verejné zverejnenie zraniteľnosti s atribúciou

Pre zraniteľnosti, ktoré sú aktívne zneužívané, môže byť timeline kratší.

## Rozsah

Vzťahuje sa na:

- Kód v repozitári `ltksolutions/clubup`
- Marketingový web `clubup.sk`
- Študentskú aplikáciu `app.clubup.sk` (po nasadení)
- Admin aplikáciu `admin.clubup.sk` (po nasadení)
- API endpoints ClubUp

**Mimo rozsahu:**

- Závislosti tretích strán (hláste priamo ich autorom; my zaktualizujeme po ich fixe)
- Zraniteľnosti v `auth.sportup.sk` — patria do projektu SportUp.sk, hláste na `sportup@ltk.solutions`
- Zraniteľnosti v 24-pay.sk platobnej bráne — hláste priamo ich prevádzkovateľovi
- Sociálne inžinierstvo a phishing voči autorom projektu

## Bezpečnostné princípy projektu

Detaily v [`docs/operations/security.md`](docs/operations/security.md):

- Zero-trust prístupový model
- SSO so SportUp.sk — žiadne lokálne heslá v ClubUp
- Šifrovanie citlivých polí v pokoji (osobné údaje študentov)
- Audit log každého API volania a každej platby
- Rate limiting na public endpoints
- HMAC verifikácia 24-pay webhookov
- Pravidelné dependency audity (npm audit, GitHub Dependabot)
- Pravidelné penetračné testy (po nasadení Fáza 3+)

## Špecifiká citlivých údajov

- **Platobné údaje** — neukladáme čísla kariet, IBAN ani CVV. 24-pay je PCI DSS poskytovateľ; my evidujeme len `transaction_id` a stav.
- **Osobné údaje študentov** — meno, email, IČO/DIČ pre faktúry. Identifikátor osoby je `sportup_person_id` zo SSO.
- **Obsah testov** — odpovede sa neukazujú študentom pred dokončením testu; po dokončení sa zobrazujú len ich vlastné výsledky.
- **Certifikáty** — registračné číslo a hash sú verejne overiteľné na `/verify/{certificate_id}`. Nezverejňujeme meno/dátum bez verifikačného kódu.
