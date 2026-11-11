# AGENTS.md: Projektinstruktioner för lektionstavla

Lektionstavla är en widgetbaserad klassrumsskärm med klockor, timers och text.
Repot innehåller tavlan och en separat landningssida för lektionstavla.se.
Landningssidan länkar till app.lektionstavla.se och partille.lektionstavla.se.
Tavlan driftsätts på Cloudflare Workers med namnen `lektionstavla` respektive
`lektionstavla-partille`. Landningssidans deploy-konfiguration finns inte i repot.

## Arbetsplats

Den aktiva arbetskopian finns på **server1** i
`/home/varohlen/utveckling/lektionstavla`. Gör allt nytt arbete där via T3 Connect
eller, från laptopen, `ssh server1-ts`. Laptopens klon är avvecklad.

## Verktyg

Monorepot använder `pnpm@10.32.1` och `pnpm-workspace.yaml`. Landing kräver Node.js `>=22.12.0`.
Från repots rot finns följande kommandon:

```sh
pnpm install
pnpm dev:board
pnpm dev:landing
pnpm build:board
pnpm build:landing
```

För arbete i `apps/board` gäller även dess befintliga `AGENTS.md`, som föreskriver
Vite+-verktyget `vp`, inklusive `vp install` för installation. Kör där:

```sh
vp dev
vp build
vp run check        # package.json: svelte-kit sync och svelte-check
vp check            # Vite+: format, lint och typkontroll
vp test run         # tester utan bevakningsläge
```

## Stack

- Board: Svelte 5 med runes, SvelteKit 2, TypeScript och Cloudflare-adapter.
- Board använder Vite+; workspace-katalogen ersätter `vite` och `vitest` med Vite+-paket. Testerna importerar från `vite-plus/test`.
- Landing: Astro 6 med Svelte-integration och Tailwind CSS 4 via Vite-plugin.
- Brödtextwidgeten använder Tiptap; QR-koder skapas med `qrcode`.

## Struktur

```text
apps/
  board/
    AGENTS.md                 # lokala Vite+-instruktioner
    src/routes/+page.svelte    # tavlans interaktion och tillstånd
    src/routes/matte/          # omdirigeringar till matematik.nu
    src/lib/board/             # dokumentformat, lagring, tid och widgetmått
    src/lib/components/widgets/
    src/lib/variant/           # widgetutbud och startlayout
    src/themes/               # default och partille-gymnasium
    wrangler*.jsonc            # en Worker-konfiguration per skolvariant
  landing/
    src/pages/                # startsida och /updates
    src/content/uppdateringar/ # Markdown med title och date i frontmatter
    src/content.config.ts     # schema för uppdateringarna
```

## Arbetsflöde och gotchas

- `THEME` väljs vid bygge, inte i webbläsaren. `svelte.config.js` kopplar `$theme` till temamappen; utan miljövariabel används `default`.
- Teman styr profil och utseende. Widgetutbud och startlayout kommer separat från `src/lib/variant/core.ts` och `default.ts`.
- Aktiv tavla lagras i localStorage under `lektionstavla.board.v1`. Bibliotekets tavlor och mallar ligger i IndexedDB `lektionstavla-library`. Bevara kompatibiliteten med dokumentformatet `version: 1` och äldre lagrade tavelflaggor på toppnivå.
- `/matte` och `/matte/[...rest]` gör permanenta omdirigeringar till matematik.nu och behåller query-parametrar. Matematikmaterialet ligger i ett annat projekt.
- Deploy-kommandon körs från `apps/board`. `vp run deploy` kör bara Wrangler och kräver ett föregående `vp build`.
- `vp run deploy:partille` bygger med `THEME=partille-gymnasium` och deployar med `wrangler.partille.jsonc`. Båda varianterna använder samma byggkatalog `.svelte-kit/cloudflare`; bygg rätt tema inför varje deploy.
- Landing saknar deploy-, check- och testskript i `package.json`; dess README är Astro-startmallens dokumentation.

## Linear

Ärenden för detta repo ligger i Linear-teamet VIK, projektet "lektionstavla.se". Använd befintliga etiketter (t.ex. Innehåll, Bug, Feature, Improvement, Interaktivitet, Bedömning, Bilder/R2, Källor, Beslut, Plattform). Skapa inte nya projekt eller etiketter utan att fråga.
