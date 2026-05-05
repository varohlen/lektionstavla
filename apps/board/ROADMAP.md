# Roadmap

Det här dokumentet är en enkel överblick över vad som ligger närmast för Lektionsvy App.

Tanken är:

- `README.md` beskriver projektet och strukturen
- `ROADMAP.md` samlar riktning, kända begränsningar och nästa steg
- GitHub Issues används för konkreta buggar, features och arbetsuppgifter

## Närmast

- fortsätta flytta variantspecifika val bort från motorn och in i `src/lib/variant/`
- förbättra rubrikwidgetens UI och finputsa toolbar/paletter
- lägga till export/import av layouter
- fortsätta testa att core-uppdateringar går att synca rent till brandade varianter

## Senare

- bättre stöd för feature flags per widget
- fler widgets i core som kan slås på eller av per variant
- bättre system för skol-/kommunspecifika interaktionswidgets
- tydligare contributor-flöde för att skapa nya teman och varianter

## Kända Begränsningar

- rubrikboxens padding är inte optiskt perfekt för alla fonter och ord
- fullscreen/responsiv layout fungerar bättre nu, men är fortfarande inte anchor-baserad
- vissa widgetförbättringar kräver fortfarande ändringar i motorn i stället för bara i config

## Idéer

- återställ/export/import direkt från UI
- fler fördefinierade layouter
- enklare variantstarter för andra skolor
- fler standardwidgets som går att aktivera utan att forka motorn

## Hur Den Används

När något dyker upp:

1. Lägg det här om det är riktning, teknisk skuld eller något att hålla i huvudet.
2. Skapa en GitHub Issue om det är ett konkret jobb eller en rapporterad bugg.
3. Flytta eller ta bort punkter när de är genomförda.
