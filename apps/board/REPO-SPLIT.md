# Repo Split Plan

Det här repot är på väg att bli den publika `lektionsvy-app`-kärnan.
För att kunna ha brandade varianter som closed source behöver Partille brytas ut
till ett eget privat repo innan core-appen öppnas publikt.

## Målbild

- `lektionsvy-landing` (publikt): `lektionsvy.se`
- `lektionsvy-app` (publikt): `app.lektionsvy.se`
- `lektionsvy-partille` (privat): `partille.lektionsvy.se`

## Principer

- Core-repot ska bara innehålla generisk produktlogik.
- Branding ska ligga i tema, config och assets.
- Kundspecifika widgets eller integrationer ska ligga i variantrepo när de inte
  ska open sourcas.
- Upstream-flödet ska gå från `lektionsvy-app` till variantrepon, inte tvärtom.

## Redan Förberett I Core

- Aktivt tema styr metadata, logotyp och textwidget-inställningar via
  `src/lib/theme/types.ts`.
- Trelson är kvar i core-appen och kan styras via tema-config om en variant
  behöver dölja den.
- Textwidgetens fontväxling är gjord generisk (`body`/`display`) i stället för
  Partille-specifik.

## Skapa `lektionsvy-partille`

1. Skapa ett nytt privat repo: `lektionsvy-partille`.
2. Utgå från nuvarande appkod innan Partille-filer tas bort ur core.
3. I Partille-repot:
   - använd `src/themes/partille-gymnasium/config.ts`
   - använd `src/themes/partille-gymnasium/theme.css`
   - behåll Partille-assets och eventuell lokal metadata
4. Peka deployen till egen Worker och egen custom domain.

## Städning Som Bör Göras I Core Efter Splitten

När Partille-repot är skapat och verifierat bör följande flyttas ut eller tas
bort från core-repot:

- `src/themes/partille-gymnasium/`
- `static/pg.svg`
- `static/pg-negativ.svg`

## Rekommenderad Git-Modell

- `lektionsvy-app` är upstream.
- `lektionsvy-partille` pullar eller cherry-pickar förändringar från upstream.
- Undvik att ändra kärnlogik direkt i variantrepot om ändringen kan göras
  generiskt i upstream först.

## Kort Checklista Inför Publicering

- Kontrollera att default-temat är aktivt i core.
- Kontrollera att Partille-loggor och metadata inte är default i core.
- Kontrollera att inga kundspecifika domäner, integrationer eller secrets finns
  i core-repot.
