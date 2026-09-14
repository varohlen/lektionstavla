<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<div class="matte">
  {@render children()}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap');

  /* Math skin shared by every page under /matte — summor house style (hunter green + amber,
     no serif). Emphasis follows the summor callout pattern: tinted border + tinted fill,
     never a left accent bar. Tokens cascade to the pages as custom properties. */
  .matte {
    --bg: hsl(131, 3%, 96%);
    --surface: hsl(131, 3%, 98.5%);
    --ink: hsl(0, 0%, 10%);
    --muted: hsl(0, 0%, 10%, 0.58);
    --subtle: hsl(0, 0%, 10%, 0.4);
    --accent: hsl(131, 22%, 29%);
    --accent-strong: hsl(131, 32%, 22%);
    --amber: hsl(30, 80%, 46%);
    --amber-strong: hsl(30, 90%, 38%);
    /* Timer dial hue — one value to swap the whole sector */
    --dial: hsl(348, 78%, 41%);
    --border: hsl(131, 8%, 88%);
    --border-subtle: hsl(131, 8%, 92%);
    --shadow: 0 2px 10px hsl(131, 20%, 12%, 0.06), 0 0 0 1px hsl(131, 20%, 12%, 0.02);

    box-sizing: border-box;
    /* The board app locks body scrolling, so this wrapper is the scroll container */
    height: 100dvh;
    overflow-y: auto;
    /* Squared background — math paper, same construction as the board's grid view */
    background-color: var(--bg);
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--accent) 12%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--accent) 12%, transparent) 1px, transparent 1px);
    background-size: 24px 24px;
    color: var(--ink);
    font-family: 'Lexend Deca', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .matte :global(*) { box-sizing: border-box; }
</style>
