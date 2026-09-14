<script lang="ts">
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Matematik · Välj klass</title>
  <meta name="description" content="Matematiklektionen, samlad. Välj klass för tavlan eller planeringen." />
</svelte:head>

<div class="page">
  <header>
    <p class="eyebrow">Matematik</p>
    <h1>Välj klass</h1>
  </header>

  <ul class="classes">
    {#each data.classes as plan (plan.id)}
      <li class="card">
        <p class="klass">{plan.klass}</p>
        {#if plan.course}
          <p class="course">{plan.course}</p>
        {/if}
        <div class="actions">
          <a class="primary" href="/matte/{plan.id}">Tavlan</a>
          <a href="/matte/{plan.id}/planering">Planering</a>
        </div>
      </li>
    {/each}
  </ul>
</div>

<style>
  .page {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: min(760px, 100%);
    margin: 0 auto;
    padding: clamp(32px, 6vw, 72px) clamp(16px, 4vw, 32px);
  }

  header { margin-bottom: clamp(20px, 3vw, 32px); }
  .eyebrow {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--subtle);
  }
  h1 {
    margin: 0;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 300;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }

  .classes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(12px, 2vw, 20px);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .card {
    padding: clamp(22px, 3vw, 32px);
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 18px;
    box-shadow: var(--shadow);
  }
  .klass {
    margin: 0;
    font-size: clamp(40px, 6vw, 60px);
    font-weight: 300;
    letter-spacing: -0.035em;
    line-height: 1;
  }
  .course {
    margin: 10px 0 0;
    font-size: 18px;
    color: var(--muted);
  }

  .actions { display: flex; gap: 10px; margin-top: clamp(20px, 3vw, 28px); }
  .actions a {
    padding: 10px 18px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s;
  }
  .actions a:hover { background: var(--border-subtle); }
  .actions a.primary { background: var(--accent); border-color: var(--accent); color: white; }
  .actions a.primary:hover { background: var(--accent-strong); border-color: var(--accent-strong); }
  .actions a:focus-visible { outline: 3px solid var(--amber); outline-offset: 3px; }
</style>
