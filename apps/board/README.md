# Lektionsvy App

Lektionsvy App är den öppna kärnappen för Lektionsvy, byggd i SvelteKit/Vite+.

Projektet är just nu ett POC i SvelteKit/Vite+ med fokus på:

- fri placering av widgets
- digital och analog timer
- digital och analog klocka
- skolprofilering per organisation
- fullscreen-läge för klassrumsskärm

Se också [ROADMAP.md](/Users/varohlen/utveckling/lektionsvy-app/ROADMAP.md) för nästa steg, kända begränsningar och idéer.

## Struktur

Projektet är uppdelat i tre lager:

- `src/routes/+page.svelte` är motorn som renderar tavlan, hanterar drag/resize, fullscreen och persistence.
- `src/lib/board/` definierar det portabla boardformatet som ska kunna delas mellan olika brandade varianter.
- `src/lib/variant/` styr appens beteende: vilka widgets som finns, deras defaults, startlayout och widgetspecifika startvärden.
- `src/themes/` styr utseendet: färger, fonter, logotyper och annan branding.

### Variantmodell

Variantlagret bygger på `core defaults + overrides`:

- `src/lib/variant/core.ts` innehåller full widgetkatalog och rimliga standardvärden för core.
- `src/lib/variant/default.ts` innehåller bara overrides för den aktuella varianten/repot.
- `src/lib/variant/index.ts` merger ihop dessa till den `config` som motorn använder.

Det betyder att nya widgets normalt bara behöver läggas till i `core.ts`. Andra varianter ärver då defaults automatiskt och behöver bara overridea det som faktiskt skiljer sig, till exempel loggans position, enabled/disabled eller specifika startvärden.

## För Forkar Och Varianter

Tanken är att mindre anpassningar ska kunna göras utan att röra motorn:

- ändra `src/themes/` om du vill byta utseende
- ändra `src/lib/variant/default.ts` om du vill byta vilka widgets som är aktiva, deras startlayout eller startvärden
- ändra widgetkod/motor först när du faktiskt bygger ny funktionalitet

Det gör det enklare att skapa skol- eller organisationsspecifika varianter utan att börja forka stora delar av appen.

## Lägga Till En Ny Widget

Normalflödet för en ny widget är:

1. Bygg själva widgeten i core.
2. Lägg till dess default-definition i `src/lib/variant/core.ts`.
3. Om en viss variant ska bete sig annorlunda, lägg bara den skillnaden i `src/lib/variant/default.ts`.

På så sätt blir vanliga upstream-merges mellan core och brandade varianter betydligt smidigare.

## Portabla Boards

Boardstate håller på att brytas ut till ett eget portabelt format under
`src/lib/board/`.

Tanken är att:

- samma board-JSON ska fungera i core och i brandade varianter
- boardfilen ska vara agnostisk till skolans branding
- varianten ska applicera färger, loggor och fonts ovanpå boardens innehåll
- saknade widgettyper i en viss variant ska kunna varnas för utan att resten av boarden går sönder

Det innebär i praktiken att export/import på sikt ska handla om boards, inte om teman.

Boardlagret innehåller nu också en enkel `IndexedDB`-wrapper för lokala
sparade tavlor och mallar. Tanken är att flera sparade screens/templates ska
bygga på exakt samma portabla boardformat som export/import använder.

## Utveckling

Installera beroenden:

```sh
vp install
```

Starta utvecklingsservern:

```sh
vp dev
```

Kör kontroll:

```sh
vp check
```

## Nästa steg

- deploy till Cloudflare för test i produktionsläge
- fortsätta tunna ut motorn genom att flytta fler variantspecifika val till config
