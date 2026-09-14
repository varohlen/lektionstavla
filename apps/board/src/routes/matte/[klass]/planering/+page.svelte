<script lang="ts">
  import { onMount } from 'svelte';
  import { groupByWeek } from '$lib/mattevy/plan';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = isoDate(new Date());

  const plan = $derived(data.plan);
  const weeks = $derived(groupByWeek(plan.lessons));
  // The lesson students should look at now: today's, or the next one that is actually held.
  const upcoming = $derived(plan.lessons.find((lesson) => !lesson.cancelled && lesson.date >= today));

  const asDate = (date: string) => new Date(date + 'T12:00:00');
  const weekday = (date: string) => asDate(date).toLocaleDateString('sv-SE', { weekday: 'long' });
  const dayMonth = (date: string) => asDate(date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

  function range(from: string, to: string) {
    if (from === to) return dayMonth(from);
    const start = asDate(from);
    const end = asDate(to);
    if (start.getMonth() === end.getMonth()) return `${start.getDate()}–${dayMonth(to)}`;
    return `${dayMonth(from)} – ${dayMonth(to)}`;
  }

  function scrollToUpcoming(behavior: ScrollBehavior = 'smooth') {
    document.getElementById('upcoming')?.scrollIntoView({ behavior, block: 'center' });
  }

  onMount(() => scrollToUpcoming('auto'));
</script>

<svelte:head>
  <title>Planering · {plan.klass}</title>
  <meta name="description" content="Planeringen för {plan.klass}: lektion för lektion, med sidor och uppgifter i boken." />
</svelte:head>

<div class="page">
  <header>
    <a class="back" href="/matte/{plan.id}">← Tavlan</a>
    <p class="eyebrow">Planering</p>
    <h1>{plan.klass}{#if plan.course}<span class="sep">–</span>{plan.course}{/if}</h1>
    {#if upcoming}
      <button class="jump" onclick={() => scrollToUpcoming()}>Till nästa lektion</button>
    {/if}
  </header>

  {#each weeks as week (week.key)}
    <section class="week" aria-labelledby="week-{week.key}">
      <h2 id="week-{week.key}">Vecka {week.week}</h2>
      <ol>
        {#each week.entries as entry (entry.key)}
          {#if entry.kind === 'lesson'}
            {@const lesson = entry.lesson}
            {@const isUpcoming = lesson === upcoming}
            <li
              class="lesson"
              class:past={lesson.date < today}
              class:upcoming={isUpcoming}
              id={isUpcoming ? 'upcoming' : undefined}
            >
              <div class="when">
                <span class="weekday">{weekday(lesson.date)}</span>
                <strong>{dayMonth(lesson.date)}</strong>
                {#if isUpcoming}
                  <span class="badge">{lesson.date === today ? 'Idag' : 'Nästa lektion'}</span>
                {/if}
              </div>
              <div class="what">
                <h3>{lesson.title}</h3>
                {#if lesson.pages}
                  <p class="pages">s. <strong>{lesson.pages}</strong> i boken</p>
                {/if}
                {#if lesson.tasks}
                  <p class="tasks">{lesson.tasks}</p>
                {/if}
                {#if lesson.notes.length}
                  <div class="note">
                    {#each lesson.notes as line, i (i)}
                      <p>{line}</p>
                    {/each}
                  </div>
                {/if}
              </div>
            </li>
          {:else}
            <li class="break">
              <span>{entry.reason}</span>
              <span class="range">{range(entry.from, entry.to)}</span>
            </li>
          {/if}
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  .page {
    width: min(880px, 100%);
    margin: 0 auto;
    padding: clamp(24px, 5vw, 64px) clamp(16px, 4vw, 40px) 96px;
  }

  header { margin-bottom: clamp(16px, 3vw, 28px); }
  .back {
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
    text-decoration: none;
  }
  .back:hover { text-decoration: underline; }
  .eyebrow {
    margin: clamp(20px, 3vw, 32px) 0 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--subtle);
  }
  h1 {
    margin: 0;
    font-size: clamp(30px, 5vw, 52px);
    font-weight: 300;
    letter-spacing: -0.03em;
    line-height: 1.08;
  }
  h1 .sep { margin: 0 0.3em; color: var(--subtle); }
  .jump {
    margin-top: 18px;
    padding: 8px 16px;
    border: 1px solid color-mix(in srgb, var(--border) 70%, var(--accent) 30%);
    border-radius: 999px;
    background: var(--surface);
    font: inherit;
    font-size: 14px;
    font-weight: 500;
    color: var(--accent);
    cursor: pointer;
    transition: background 0.15s;
  }
  .jump:hover { background: var(--border-subtle); }
  .back:focus-visible,
  .jump:focus-visible { outline: 3px solid var(--amber); outline-offset: 3px; }

  .week { margin-top: clamp(12px, 2vw, 20px); }
  /* Sticky week label, frosted so the grid behind it doesn't read as noise */
  .week h2 {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0;
    padding: 12px 0 10px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--subtle);
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: blur(6px);
  }
  ol {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .lesson {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    gap: clamp(14px, 2.4vw, 28px);
    padding: clamp(16px, 2.4vw, 24px);
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    scroll-margin: 80px;
  }
  .lesson.past { background: color-mix(in srgb, var(--surface) 55%, transparent); }
  .lesson.past .what,
  .lesson.past .when { opacity: 0.66; }
  /* Same emphasis as the lesson card on the board: tinted border + tinted fill */
  .lesson.upcoming {
    background: color-mix(in srgb, var(--surface) 94%, var(--accent) 6%);
    border-color: color-mix(in srgb, var(--border) 60%, var(--accent) 40%);
    box-shadow: var(--shadow);
  }

  .when { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; }
  .weekday { font-size: 13px; color: var(--muted); text-transform: capitalize; }
  .when strong { font-size: 17px; font-weight: 600; }
  .badge {
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--accent);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: white;
  }

  h3 {
    margin: 0;
    font-size: clamp(19px, 2.2vw, 24px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .pages { margin: 6px 0 0; font-size: 15px; color: var(--muted); }
  .pages strong { font-weight: 600; color: var(--amber); }
  .tasks {
    margin: 10px 0 0;
    font-size: clamp(16px, 1.8vw, 19px);
    line-height: 1.5;
    color: var(--accent-strong);
  }
  .note {
    margin-top: 12px;
    padding: 10px 14px;
    border: 1px solid color-mix(in srgb, var(--border) 64%, var(--amber) 36%);
    background: color-mix(in srgb, var(--surface) 92%, var(--amber) 8%);
    border-radius: 10px;
    font-size: 15px;
    line-height: 1.5;
    color: color-mix(in srgb, var(--ink) 86%, var(--amber) 14%);
  }
  .note p { margin: 0; }

  .break {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px clamp(16px, 2.4vw, 24px);
    border: 1px dashed var(--border);
    border-radius: 14px;
    background: color-mix(in srgb, var(--bg) 70%, transparent);
    font-size: 15px;
    color: var(--muted);
  }
  .break .range { color: var(--subtle); white-space: nowrap; }

  @media (max-width: 600px) {
    .lesson { grid-template-columns: 1fr; gap: 10px; }
    .when { flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: 8px; }
    .badge { margin-top: 0; }
  }
</style>
