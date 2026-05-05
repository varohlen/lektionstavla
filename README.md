# Lektionstavla

Widgetbaserad klassrumsskarm for svenska skolor. Visa klockor, timers, text och mer pa storskarm i klassrummet.

## Struktur

```
apps/
  board/      SvelteKit-appen (huvudprodukten)
  landing/    Astro-baserad landing page
```

## Teman

Board-appen stodjer flera skolvarianter via teman. Temat valjs med `THEME` env-var vid build:

```sh
pnpm --filter board build                          # default
THEME=partille-gymnasium pnpm --filter board build # Partille Gymnasium
```

Teman ligger under `apps/board/src/themes/`.

## Utveckling

```sh
pnpm install
pnpm --filter board dev       # Starta board
pnpm --filter landing dev     # Starta landing page
```

## Deploy

Varje variant deployas som en separat Cloudflare Worker:

```sh
cd apps/board
wrangler deploy                              # default
THEME=partille-gymnasium wrangler deploy -c wrangler.partille.jsonc  # Partille
```
