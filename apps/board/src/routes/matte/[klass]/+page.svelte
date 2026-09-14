<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Lesson } from '$lib/mattevy/plan';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const isoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // First lesson today or later; falls back to the last one when the plan has ended.
  function todayIndex(list: Lesson[], date: string) {
    const found = list.findIndex((l) => l.date >= date);
    return found < 0 ? list.length - 1 : found;
  }

  // Cancelled lessons and holidays belong on the planning page, not on the board.
  const lessons = $derived(data.plan.lessons.filter((lesson) => !lesson.cancelled));

  // Start on today's lesson already during SSR, so the page doesn't flash lesson one.
  let index = $state(untrack(() => todayIndex(lessons, isoDate(new Date()))));
  let now = $state(new Date());
  let fullscreen = $state(false);

  const current = $derived(lessons[index]);
  const previous = $derived(lessons[index - 1]);
  const next = $derived(lessons[index + 1]);

  const today = $derived(isoDate(now));
  const clock = $derived(now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }));
  const longDate = $derived(now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }));

  const dayMonth = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

  // A lesson starts the timer at its scheduled length, unless a countdown is running.
  const lessonSeconds = (lesson: Lesson | undefined) => Math.min(60, lesson?.minutes ?? 25) * 60;

  function select(target: number) {
    if (target < 0 || target >= lessons.length) return;
    index = target;
    if (endsAt === null) remaining = lessonSeconds(lessons[target]);
  }

  function goToday() {
    select(todayIndex(lessons, today));
  }

  function step(offset: number) {
    select(index + offset);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* fullscreen not available */
    }
  }

  function onKey(event: KeyboardEvent) {
    if (event.target !== document.body) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  }

  /* ---------- Analog timer (dial geometry ported from LessonTimerWidget) ---------- */

  const DIAL_CENTER = 50;
  const LABEL_RADIUS = 45;
  const TICK_OUTER_RADIUS = 35.5;
  const MINOR_TICK_INNER_RADIUS = 31.8;
  const MAJOR_TICK_INNER_RADIUS = 29.2;
  const SECTOR_RADIUS = 27.6;

  const dialAngle = (minutes: number) => -90 - minutes * 6;

  function polar(radius: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: DIAL_CENTER + Math.cos(rad) * radius, y: DIAL_CENTER + Math.sin(rad) * radius };
  }

  const labels = [0, 10, 20, 30, 40, 50].map((value) => ({ value, ...polar(LABEL_RADIUS, dialAngle(value)) }));
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const angle = dialAngle(i);
    const major = i % 10 === 0;
    const outer = polar(TICK_OUTER_RADIUS, angle);
    const inner = polar(major ? MAJOR_TICK_INNER_RADIUS : MINOR_TICK_INNER_RADIUS, angle);
    return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major };
  });

  function describeSector(minutes: number) {
    const m = Math.max(0, Math.min(minutes, 60));
    if (m <= 0 || m >= 60) return '';
    const sweep = m * 6;
    const start = polar(SECTOR_RADIUS, -90);
    const end = polar(SECTOR_RADIUS, -90 - sweep);
    return `M ${DIAL_CENTER} ${DIAL_CENTER} L ${start.x} ${start.y} A ${SECTOR_RADIUS} ${SECTOR_RADIUS} 0 ${sweep > 180 ? 1 : 0} 0 ${end.x} ${end.y} Z`;
  }

  let remaining = $state(untrack(() => lessonSeconds(lessons[index])));
  let endsAt = $state<number | null>(null);
  let dialFace = $state<HTMLDivElement | null>(null);
  let dragAngle = $state<number | null>(null);
  let dragMinutes = $state<number | null>(null);

  const running = $derived(endsAt !== null);
  const dialMinutes = $derived(Math.max(0, Math.min(60, remaining / 60)));
  const sectorPath = $derived(describeSector(dialMinutes));
  const isFull = $derived(dialMinutes >= 60);
  const handStyle = $derived(`transform: translateY(-50%) rotate(${dialAngle(dialMinutes % 60)}deg);`);
  const readout = $derived(
    `${String(Math.floor(Math.max(0, remaining) / 60)).padStart(2, '0')}:${String(Math.max(0, remaining) % 60).padStart(2, '0')}`,
  );
  const expired = $derived(!running && remaining === 0);

  function toggleTimer() {
    if (endsAt !== null) {
      remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      endsAt = null;
    } else if (remaining > 0) {
      endsAt = Date.now() + remaining * 1000;
    }
  }

  function pointerAngle(clientX: number, clientY: number) {
    if (!dialFace) return null;
    const rect = dialFace.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  function onDragMove(event: PointerEvent) {
    const angle = pointerAngle(event.clientX, event.clientY);
    if (angle === null || dragAngle === null || dragMinutes === null) return;
    let delta = angle - dragAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const nextMinutes = Math.max(0, Math.min(60, dragMinutes - delta / 6));
    dragAngle = angle;
    dragMinutes = nextMinutes;
    remaining = Math.round(nextMinutes) * 60;
  }

  function stopDrag() {
    dragAngle = null;
    dragMinutes = null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', stopDrag);
  }

  function startDrag(event: PointerEvent) {
    if (running) return;
    event.preventDefault();
    const angle = pointerAngle(event.clientX, event.clientY);
    if (angle === null) return;
    dragAngle = angle;
    dragMinutes = dialMinutes;
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', stopDrag);
  }

  onMount(() => {
    goToday();

    const tick = setInterval(() => {
      now = new Date();
      if (endsAt !== null) {
        remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        if (remaining === 0) endsAt = null;
      }
    }, 250);

    const onFsChange = () => (fullscreen = Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKey);
    return () => {
      clearInterval(tick);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKey);
      stopDrag();
    };
  });
</script>

<svelte:head>
  <title>{data.plan.klass} · Lektionen idag</title>
  <meta name="description" content="Matematiklektionen, samlad. Bok och planering, lektion för lektion." />
</svelte:head>

<div class="skin">
  {#if current}
    <main>
      <article class="current" aria-live="polite">
        <div class="lesson-body">
          <h1>{current.title}</h1>

          {#if current.pages}
            <p class="pages">s. <strong>{current.pages}</strong> i boken</p>
          {/if}

          {#if current.tasks}
            <h2>Rekommenderade uppgifter</h2>
            <p class="tasks">{current.tasks}</p>
          {/if}

          {#if current.notes.length}
            <div class="note">
              {#each current.notes as line, i (i)}
                <p>{line}</p>
              {/each}
            </div>
          {/if}
        </div>

        <section class="timer" class:expired aria-label="Timer">
          <div class="dial-card">
            <div class="dial-face" bind:this={dialFace}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle class="sector-base" cx={DIAL_CENTER} cy={DIAL_CENTER} r={SECTOR_RADIUS}></circle>
                {#if isFull}
                  <circle class="sector-fill" cx={DIAL_CENTER} cy={DIAL_CENTER} r={SECTOR_RADIUS}></circle>
                {:else if sectorPath}
                  <path class="sector-fill" d={sectorPath}></path>
                {/if}
                {#each ticks as tick, i (i)}
                  <line class="tick" class:major={tick.major} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}></line>
                {/each}
                {#each labels as label (label.value)}
                  <text class="dial-label" x={label.x} y={label.y}>{label.value}</text>
                {/each}
              </svg>
              <button
                class="hand"
                type="button"
                style={handStyle}
                aria-label="Dra för att ställa tiden"
                onpointerdown={startDrag}
              ><span></span></button>
              <button class="knob" type="button" aria-label="Dra för att ställa tiden" onpointerdown={startDrag}></button>
            </div>

            <div class="dial-controls">
              <button class="pill action" onclick={toggleTimer}>
                <span class="play-pause-icon" aria-hidden="true">
                  {#if running}
                    <span class="pause-bars"><span></span><span></span></span>
                  {:else}
                    <span class="play-triangle"></span>
                  {/if}
                </span>
                <span>{running ? 'Paus' : 'Start'}</span>
              </button>
              <span class="pill readout" aria-live="polite">{readout}</span>
            </div>
          </div>
        </section>
      </article>

      <aside>
        <div class="clock">
          <div class="clock-top">
            <div class="clock-tools">
              <button class="fs" onclick={toggleFullscreen} aria-label="Helskärm">{fullscreen ? '↙' : '⛶'}</button>
              <div class="orientation">
                <p><strong>{data.plan.klass}</strong>{#if data.plan.course}<span class="sep">–</span>{data.plan.course}{/if}</p>
                <a href="/matte/{data.plan.id}/planering">Hela planeringen →</a>
              </div>
            </div>
            <strong>{clock}</strong>
          </div>
          <span>{longDate}</span>
        </div>

        {#each [{ lesson: previous, label: 'Föregående', offset: -1 }, { lesson: next, label: 'Nästa', offset: 1 }] as item (item.label)}
          <article class="neighbor">
            {#if item.lesson}
              <button class="neighbor-hit" onclick={() => step(item.offset)}>
                <span class="neighbor-label">
                  {item.label}<span class="sep">·</span><span class="when">{dayMonth(item.lesson.date)}</span>
                </span>
                <span class="neighbor-title">{item.lesson.title}</span>
                {#if item.lesson.pages}
                  <span class="neighbor-pages">s. {item.lesson.pages}</span>
                {/if}
                {#if item.lesson.tasks}
                  <span class="neighbor-tasks">{item.lesson.tasks}</span>
                {:else if item.lesson.notes.length}
                  <span class="neighbor-tasks">{item.lesson.notes.join(' · ')}</span>
                {/if}
              </button>
            {:else}
              <span class="neighbor-label">{item.label}</span>
            {/if}
          </article>
        {/each}
      </aside>
    </main>
  {:else}
    <p class="empty">Det finns inga lektioner i planeringen för {data.plan.klass} ännu.</p>
  {/if}
</div>

<style>
  /* Tokens, font and the squared background come from the /matte layout. */
  .skin {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 0 clamp(20px, 3.5vw, 56px);
  }
  button { font: inherit; color: inherit; cursor: pointer; border: 0; background: transparent; }
  button:focus-visible { outline: 3px solid var(--amber); outline-offset: 3px; border-radius: 10px; }

  .empty { margin: auto; font-size: 18px; color: var(--muted); }

  /* Main — current lesson dominant, clock + context stacked right */
  main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    gap: clamp(14px, 1.6vw, 22px);
    padding: clamp(16px, 2.4vh, 28px) 0 clamp(16px, 2.4vh, 28px);
    min-height: 0;
  }

  /* Clock — far right of the rail; the space to its left is for tools/logo */
  .clock { display: flex; flex-direction: column; align-items: stretch; gap: 2px; padding: 0 clamp(4px, 0.5vw, 8px); }
  .clock-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .clock-tools { display: flex; align-items: center; gap: clamp(6px, 0.8vw, 14px); min-width: 0; }
  /* Class, course and plan link — orientation for students, kept quieter than the clock */
  .orientation { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .orientation p {
    margin: 0;
    font-size: clamp(14px, 1.3vw, 20px);
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .orientation strong { color: var(--ink); font-weight: 600; }
  .orientation .sep { margin: 0 0.4em; color: var(--subtle); }
  .orientation a {
    font-size: clamp(12px, 1vw, 15px);
    font-weight: 500;
    color: var(--accent);
    text-decoration: none;
  }
  .orientation a:hover { text-decoration: underline; }
  .clock-top > strong {
    font-size: clamp(44px, 5.2vw, 84px);
    font-weight: 400;
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .clock > span {
    font-size: clamp(13px, 1.1vw, 16px);
    color: var(--muted);
    text-transform: capitalize;
    text-align: right;
  }
  .fs {
    font-size: 15px;
    color: var(--subtle);
    padding: 7px 10px;
    border-radius: 999px;
    align-self: flex-start;
    transition: background 0.15s, color 0.15s;
  }
  .fs:hover { background: var(--border-subtle); color: var(--ink); }

  .current {
    display: grid;
    grid-template-rows: minmax(0, 55fr) minmax(0, 45fr);
    background: color-mix(in srgb, var(--surface) 96%, var(--accent) 4%);
    border: 1px solid color-mix(in srgb, var(--border) 78%, var(--accent) 22%);
    border-radius: 18px;
    box-shadow: var(--shadow);
    /* Tighter at the foot so the dial's field is not eaten by padding */
    padding: clamp(24px, 3.4vw, 52px) clamp(24px, 3.4vw, 52px) clamp(16px, 1.6vw, 24px);
    min-width: 0;
  }
  /* Lesson text keeps 55% of the card; the analog timer owns the other 45% */
  .lesson-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
    overflow: hidden;
  }

  h1 {
    margin: 0;
    font-size: clamp(26px, 2.9vw, 48px);
    font-weight: 300;
    letter-spacing: -0.03em;
    line-height: 1.08;
  }

  .pages {
    margin: clamp(12px, 1.6vh, 20px) 0 0;
    font-size: clamp(16px, 1.5vw, 25px);
    color: var(--muted);
  }
  .pages strong { font-weight: 600; color: var(--amber); letter-spacing: -0.01em; }

  h2 {
    margin: clamp(16px, 2.2vh, 26px) 0 clamp(7px, 1vh, 12px);
    font-size: clamp(10px, 0.85vw, 12px);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--subtle);
  }
  /* The tasks are what students read off the projector — largest text on the page */
  .tasks {
    margin: 0;
    font-size: clamp(21px, 2.4vw, 40px);
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.015em;
    color: var(--accent-strong);
  }

  /* Same size as the tasks — students read this off the projector too */
  .note {
    margin: clamp(18px, 2.4vh, 26px) 0 0;
    padding: clamp(12px, 1.4vh, 18px) clamp(16px, 1.5vw, 24px);
    border: 1px solid color-mix(in srgb, var(--border) 64%, var(--amber) 36%);
    background: color-mix(in srgb, var(--surface) 92%, var(--amber) 8%);
    border-radius: 14px;
    font-size: clamp(21px, 2.4vw, 40px);
    line-height: 1.4;
    letter-spacing: -0.015em;
    color: color-mix(in srgb, var(--ink) 86%, var(--amber) 14%);
  }
  .note p { margin: 0; }

  /* Context cards */
  aside {
    display: grid;
    grid-template-rows: auto 1fr 1fr;
    gap: clamp(12px, 1.4vw, 18px);
    min-height: 0;
  }
  .neighbor {
    display: flex;
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    min-height: 0;
    overflow: hidden;
    /* Opaque so the page grid stays in the gutters, not inside the cards */
    background: color-mix(in srgb, var(--bg) 55%, white);
  }
  .neighbor:nth-of-type(2) { background: var(--surface); }
  .neighbor-hit {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
    width: 100%;
    text-align: left;
    padding: clamp(14px, 1.6vw, 24px);
    border-radius: 14px;
    transition: background 0.15s;
  }
  .neighbor-hit:hover { background: hsl(131, 22%, 29%, 0.05); }
  .neighbor-label {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: clamp(14px, 1.6vw, 24px) 0 0 clamp(14px, 1.6vw, 24px);
    font-size: clamp(11px, 1vw, 14px);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
  }
  .neighbor-hit .neighbor-label { padding: 0; }
  /* Empty state (no previous/next lesson) — anchor the label to the top */
  .neighbor > .neighbor-label { align-self: flex-start; color: var(--subtle); }
  .neighbor-label .sep { color: var(--subtle); }
  .neighbor-label .when {
    color: var(--muted);
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0.01em;
  }
  /* Bigger than before, but kept well below the lesson card (h1 max 48px, tasks max 40px) */
  .neighbor-title {
    font-size: clamp(19px, 1.9vw, 31px);
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .neighbor-pages { font-size: clamp(14px, 1.3vw, 20px); color: var(--muted); }
  .neighbor-tasks {
    font-size: clamp(14px, 1.3vw, 20px);
    line-height: 1.45;
    color: var(--muted);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Analog timer — rounded-square frame around a round dial, as in the board widget.
     The frame is the largest square that fits its row, centred. */
  .timer {
    display: grid;
    place-items: center;
    min-height: 0;
  }
  .dial-card {
    position: relative;
    height: 100%;
    aspect-ratio: 1;
    max-width: 100%;
    /* Only as much inset as the rim needs — the dial fills the frame */
    padding: clamp(8px, 0.75vw, 13px);
    border-radius: clamp(18px, 1.9vw, 32px);
    background: hsl(0, 0%, 100%);
    /* Double inner rim + generous drop shadow — lifts the frame off the lesson card */
    box-shadow:
      inset 0 0 0 clamp(4px, 0.42vw, 7px) color-mix(in srgb, var(--ink) 13%, transparent),
      inset 0 0 0 clamp(7px, 0.72vw, 12px) hsl(0, 0%, 100%, 0.72),
      0 14px 34px color-mix(in srgb, hsl(131, 22%, 12%) 16%, transparent);
  }
  .dial-face {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: hsl(0, 0%, 100%);
    overflow: hidden;
  }
  .dial-face svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  /* Filled sector = time still left to work. */
  .sector-base { fill: color-mix(in srgb, var(--dial) 10%, white); }
  .sector-fill { fill: var(--dial); opacity: 0.94; }
  .tick { stroke: color-mix(in srgb, var(--ink) 34%, transparent); stroke-width: 0.4; stroke-linecap: round; }
  .tick.major { stroke: color-mix(in srgb, var(--ink) 70%, transparent); stroke-width: 0.82; }
  .dial-label {
    font-size: 7.2px;
    font-family: 'Lexend Deca', system-ui, sans-serif;
    font-weight: 600;
    fill: color-mix(in srgb, var(--ink) 76%, transparent);
    text-anchor: middle;
    dominant-baseline: middle;
  }
  .hand {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 31%;
    height: clamp(3px, 0.32vw, 5px);
    padding: 0;
    transform-origin: left center;
    cursor: grab;
    background: transparent;
    z-index: 3;
  }
  .hand span {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ink) 88%, transparent);
  }
  .knob {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5.2%;
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--ink) 88%, transparent);
    box-shadow: 0 0 0 clamp(2px, 0.18vw, 3px) hsl(0, 0%, 100%, 0.88);
    cursor: grab;
    z-index: 4;
  }
  /* Controls float over the foot of the dial as two quiet pills — start/pause is
     for the teacher, and the digital time must not compete with the dial. */
  .dial-controls {
    position: absolute;
    left: clamp(14px, 1.5vw, 24px);
    right: clamp(14px, 1.5vw, 24px);
    bottom: clamp(10px, 1.1vw, 18px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(8px, 0.9vw, 14px);
    z-index: 5;
    pointer-events: none;
  }
  .pill {
    --widget-scale: 0.92;
    display: inline-flex;
    align-items: center;
    gap: clamp(5px, 0.5vw, 8px);
    padding: clamp(5px, 0.5vw, 8px) clamp(10px, 0.95vw, 15px);
    border: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
    border-radius: 999px;
    background: hsl(0, 0%, 100%, 0.86);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--ink) 9%, transparent);
    backdrop-filter: blur(12px);
    font-size: clamp(12px, 1vw, 15px);
    line-height: 1;
    white-space: nowrap;
  }
  .pill.action {
    font-weight: 600;
    color: var(--ink);
    pointer-events: auto;
  }
  .pill.action:hover { background: hsl(0, 0%, 100%, 0.98); }
  .pill.readout {
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  .timer.expired .pill.readout { color: var(--dial); animation: pulse 1.6s ease-in-out infinite; }
  .timer.expired .sector-base { fill: color-mix(in srgb, var(--dial) 22%, white); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

  @media (max-width: 900px) {
    .skin { height: auto; min-height: 100%; }
    main { grid-template-columns: 1fr; }
    aside { grid-template-rows: auto auto auto; }
    h1 { font-size: clamp(32px, 7vw, 46px); }
    .tasks { font-size: clamp(17px, 3.4vw, 22px); }
    .clock { order: -1; }
    .clock-top > strong { font-size: 40px; }
    .dial-face { width: 120px; }
  }
</style>
