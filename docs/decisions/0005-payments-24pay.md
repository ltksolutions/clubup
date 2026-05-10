# ADR-0005: Platobná brána 24-pay.sk

- **Status:** Accepted
- **Dátum:** 2026-05-10
- **Rozhodol:** Ján Letko (LTK Solutions)
- **Súvisiace ADR:** ADR-0001 (tech stack), ADR-0003 (hosting)

## Kontext

ClubUp predáva online kurzy slovenským zákazníkom (FO aj PO). Platobné požiadavky:

- **EUR** ako primárna mena
- **Platba kartou** (Visa, Mastercard) — najčastejšia
- **Apple Pay / Google Pay** — pre mobile-first skúsenosť
- **Bankový prevod / TatraPay / VÚB Pay** — slovenskí zákazníci ich preferujú pri vyšších sumách
- **Faktúra na firmu (SEPA)** — pre kluby, ktoré kupujú v mene organizácie
- **Refundácia** — možnosť vrátiť peniaze (zo zákona o ochrane spotrebiteľa)
- **PCI DSS compliance** — nesmieme uchovávať čísla kariet

Dôležitý kontext:
- Cieľoví zákazníci sú **slovenskí** — preferujú slovenské banky a platobné metódy
- Cieľová cena kurzu je rádovo **stovky EUR** (orientačne 200–500 €)
- Mesačný objem v 1. roku: **5–20 platieb / mesiac**, neskôr stovky

## Zvažované možnosti

### Možnosť A — Stripe
- **Pros:** developer-friendly API, výborná dokumentácia, podporuje Apple Pay / Google Pay out of the box, globálny dosah
- **Cons:** **slabá podpora slovenských bankových metód** (TatraPay, VÚB Pay nie sú dostupné), tatranské banky nedávajú Stripe-u rovnaký bankový poplatok, vyššia provízia za EU kartové platby (~1.4% + 0.25 €), čeština/slovenčina v UI checkout-u je obmedzená

### Možnosť B — Mollie
- **Pros:** európska brána, lepšia podpora EUR a SEPA, dobré API
- **Cons:** rovnako neponúka slovenské bankové metódy ako natívnu možnosť, podpora po slovensky je len cez češtinu

### Možnosť C — 24-pay.sk
- **Pros:** **slovenská brána s podporou všetkých slovenských platobných metód** — TatraPay, VÚB Pay, ČSOB Pay, SLSP, Apple Pay, Google Pay, karty, bankový prevod cez Bankové tlačidlo. Slovenský support v slovenčine. Provízie cca 0.9–1.2% pre EU karty
- **Cons:** REST API je menej polished než Stripe, dokumentácia v slovenčine je miestami slabšia, obmedzená geografická pôsobnosť (ak by sme expandovali do Česka, Maďarska — riešili by sme druhú integráciu)

### Možnosť D — GoPay
- **Pros:** česko-slovenská brána, dobre známa
- **Cons:** UX checkout-u je staromódny, slabšia podpora Apple/Google Pay, väčší focus na český trh

### Možnosť E — Besteron
- **Pros:** slovenská brána, podporuje slovenské metódy
- **Cons:** menšia firma, menej zrelé API, vyššie poplatky

## Rozhodnutie

**24-pay.sk ako primárna platobná brána pre ClubUp.**

Integrácia:
- REST API + redirect flow (študent klikne „Kúpiť" → redirect do 24-pay → vyberie metódu → redirect späť)
- HMAC-SHA256 podpis na všetkých requestoch a webhookoch
- Webhook handler pre asynchrónnu notifikáciu o stave platby
- Refund cez admin Server Action (volá 24-pay refund API)

## Dôvody

1. **Slovenské platobné metódy** — naši zákazníci sú slovenskí a chcú TatraPay, ČSOB Pay, VÚB Pay. Stripe ani Mollie ich neponúkajú natívne.
2. **Slovenský support** — pri probléme s platbou vie 24-pay support odpovedať po slovensky a rozumie slovenským daňovým reáliám
3. **Slovenské IBAN faktúry** — kluby dostanú faktúru s IBAN účtom v slovenskej banke, čo je dôležité pre účtovníctvo
4. **Akceptovateľné API** — REST je štandardný, HMAC podpis je triviálne implementovať, webhook flow je dobre zdokumentovaný
5. **Rozumná provízia** — pri našom očakávanom objeme je rozdiel oproti Stripe < 200 € / rok, čo nestojí za stratu slovenských metód

## Dôsledky

### Pozitívne
- Slovenskí zákazníci nemajú žiadnu friction na checkoute
- Apple Pay / Google Pay funguje
- Bankové tlačidlá funguju (jednoduchý okamžitý prevod)
- Faktúry idú zo slovenskej platobnej brány s IBAN-mi v EUR

### Negatívne / kompromisy
- **Geo lock-in na SK/CZ** — ak by sme expandovali do Maďarska/Poľska, integrácia 24-pay nepokrýva ich lokálne metódy
  - Mitigácia: pridáme Stripe ako sekundárnu bránu pre EU mimo SK/CZ; používateľ uvidí len jednu z nich podľa fakturačnej krajiny
- **Menej zrelé API než Stripe** — možno narazíme na edge cases (napr. partial refunds, recurring billing). Ak budeme niekedy chcieť subscription model, treba over-iť, či 24-pay podporuje
- **Žiadne hosted checkout SDK** — robíme vlastný `/objednavky/[id]/checkout` flow s redirektom; ale pre SK trh je to v pohode
- **Webhook reliability** — 24-pay občas zopakuje webhook (preto idempotency v našej webhook tabuľke je nutná, viď [`../domain/payment.md`](../domain/payment.md))

### Neutrálne
- Vstupný proces (KYC pre merchant účet) — niekoľko dní, nie týždeň ako Stripe; trvá to, ale len raz

## Implementačné poznámky

- Detaily integrácie v [`../payments/integration.md`](../payments/integration.md):
  - HMAC-SHA256 podpis: `HMAC(secret, merchant_id + amount + currency + variable_symbol + ...)` v presnom poradí
  - Webhook handler na `/api/webhooks/24pay` overuje `x-24pay-signature` header
  - `webhook_events` Mongo kolekcia s unique indexom na `eventId` zabezpečuje idempotency
  - Test mode 24-pay merchant account pre dev
- Klient: `packages/payments-24pay` typed wrapper
- Environment vars:
  - `PAYMENT_24PAY_MERCHANT_ID`
  - `PAYMENT_24PAY_SECRET`
  - `PAYMENT_24PAY_API_URL` (test vs prod)

## Revisit

- **Pri expanzii mimo SK/CZ** — pridať Stripe ako fallback
- **Ak by 24-pay zdvihol provízie** výrazne — porovnať s Mollie pre EU karty (môžeme mať dve brány, používateľ vidí podľa fakturačnej krajiny)
- **Ak budeme chcieť subscription model** (mesačné predplatné kurzov) — overiť, že 24-pay vie recurring; ak nie, prejsť na Stripe pre subscriptions a 24-pay nechať len pre jednorazové platby

## Odkazy

- [24-pay.sk REST API dokumentácia](https://24-pay.sk/dokumentacia/) — interný link, vyžaduje merchant účet
- [Slovenský zákon o ochrane spotrebiteľa § 7](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2007/250/) — 14-dňové právo na odstúpenie
- [`../payments/integration.md`](../payments/integration.md) — implementačné detaily
- [`../domain/payment.md`](../domain/payment.md) — Payment & webhook_events entity
