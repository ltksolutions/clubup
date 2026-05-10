# Lesson — premenovaná na [Part](part.md)

> ⚠️ Táto entita bola premenovaná. Aktuálny dokument: [`part.md`](part.md).

## Prečo premenovanie

V skoršej fáze návrhu sa táto entita volala `Lesson` (lekcia). Po doplnení specifikácie funkcionality vzdelávania bola premenovaná na `Part` (Časť), pretože:

1. **Menšia granularita** — Časť môže byť kratšia než klasická lekcia (napr. 5-min video + 2 odseky textu)
2. **Kombinácia médií** — pôvodný `Lesson` mal jeden typ obsahu (video / text / prezentácia / …); `Part` má `contentBlocks[]` s viacerými typmi v jednom celku
3. **Konzistencia s domain language** — projekt používa terminológiu „Časť" v slovenčine

V kóde sa odteraz používa `Part`. V databáze: kolekcia `parts` (nie `lessons`).

Detaily v [`part.md`](part.md).
