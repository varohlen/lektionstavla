<script lang="ts">
	import { onMount } from 'svelte';
	import WidgetShell from './WidgetShell.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		startTime: number | null;
		accumulated: number;
		running: boolean;
		onToggle: () => void;
		onReset: () => void;
		onLap: () => void;
		laps: number[];
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
	};

	let {
		x,
		y,
		w,
		h,
		z,
		selected,
		startTime,
		accumulated,
		running,
		onToggle,
		onReset,
		onLap,
		laps,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
	}: Props = $props();

	const widgetScale = $derived(Math.max(0.65, Math.min(w / 480, h / 180)));

	let displayElapsed = $state(0);

	const elapsedMs = $derived(displayElapsed);
	const elapsedSeconds = $derived(Math.floor(elapsedMs / 1000));
	const hours = $derived(Math.floor(elapsedSeconds / 3600));
	const minutes = $derived(Math.floor((elapsedSeconds % 3600) / 60));
	const seconds = $derived(elapsedSeconds % 60);
	const hundredths = $derived(Math.floor((elapsedMs % 1000) / 10));

	const mainDisplay = $derived(
		hours > 0
			? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
			: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
	);

	const centisecondsDisplay = $derived(`.${String(hundredths).padStart(2, '0')}`);

	function formatLap(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const h = Math.floor(totalSeconds / 3600);
		const m = Math.floor((totalSeconds % 3600) / 60);
		const s = totalSeconds % 60;
		const cs = Math.floor((ms % 1000) / 10);
		const csStr = String(cs).padStart(2, '0');
		if (h > 0) {
			return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${csStr}`;
		}
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${csStr}`;
	}

	let rafId: number | null = null;

	$effect(() => {
		const isRunning = running;
		const currentStart = startTime;
		const currentAccumulated = accumulated;

		function update() {
			if (currentStart) {
				displayElapsed = currentAccumulated + (Date.now() - currentStart);
			}
			rafId = requestAnimationFrame(update);
		}

		if (isRunning && currentStart) {
			rafId = requestAnimationFrame(update);
		} else {
			displayElapsed = currentAccumulated;
		}

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		};
	});

	const hasElapsed = $derived(elapsedMs > 0);
</script>

<WidgetShell
	title="Stoppur"
	{x}
	{y}
	{w}
	{h}
	{z}
	{selected}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
>
	<div class="stopwatch-layout" style="--sw-scale:{widgetScale};">
		<div class="stopwatch-main">
			<div class="stopwatch-display" class:running>
				<span class="display-main">{mainDisplay}</span>
				<span class="display-cs">{centisecondsDisplay}</span>
			</div>

			<div class="stopwatch-actions">
				<button
					class="action-button"
					class:running
					type="button"
					onclick={onToggle}
				>
					<span class="play-pause-icon" aria-hidden="true">
						{#if running}
							<span class="pause-bars"><span></span><span></span></span>
						{:else}
							<span class="play-triangle"></span>
						{/if}
					</span>
					<span>{running ? 'Paus' : hasElapsed ? 'Fortsätt' : 'Start'}</span>
				</button>

				{#if running}
					<button class="action-button action-button-secondary" type="button" onclick={onLap}>
						Varv
					</button>
				{:else if hasElapsed}
					<button class="action-button action-button-secondary" type="button" onclick={onReset}>
						Nollställ
					</button>
				{/if}
			</div>
		</div>

		<div class="lap-panel">
			<p class="lap-heading">Varv</p>
			<div class="lap-list">
				{#if laps.length === 0}
					<p class="lap-empty">Inga varv ännu</p>
				{:else}
					{#each laps as lap, i}
						{@const previous = i < laps.length - 1 ? laps[i + 1] : 0}
						{@const lapDuration = lap - previous}
						<div class="lap-entry">
							<span class="lap-number">#{laps.length - i}</span>
							<span class="lap-time">{formatLap(lapDuration)}</span>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</WidgetShell>

<style>
	.stopwatch-layout {
		--sw-scale: 1;
		--widget-scale: var(--sw-scale);
		--sw-green-base: color-mix(in srgb, var(--brand-success-400) 30%, white);
		--sw-green-primary: var(--brand-success-600);
		--sw-green-strong: var(--brand-success-700);
		--sw-active-surface: color-mix(in srgb, var(--brand-success-600) 12%, transparent);
		--sw-active-border: color-mix(in srgb, var(--brand-success-700) 22%, transparent);
		--sw-active-text: var(--brand-success-700);

		display: flex;
		flex-direction: row;
		gap: 0;
		height: 100%;
		width: 100%;
	}

	:global(.screen-shell[data-theme="dark"]) .stopwatch-layout {
		--sw-green-base: color-mix(in srgb, var(--brand-success-600) 18%, transparent);
		--sw-active-surface: color-mix(in srgb, var(--brand-success-600) 18%, transparent);
		--sw-active-border: color-mix(in srgb, var(--brand-success-400) 24%, transparent);
		--sw-active-text: var(--brand-success-400);
	}

	.stopwatch-main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(0.75rem * var(--sw-scale));
		flex: 1 1 auto;
		min-width: 0;
		padding: calc(0.5rem * var(--sw-scale));
	}

	.stopwatch-display {
		display: inline-flex;
		align-items: baseline;
		font-weight: 700;
		line-height: 0.92;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
		color: var(--text);
		transition: color 200ms ease;
		white-space: nowrap;
	}

	.stopwatch-display.running {
		color: var(--sw-green-strong);
	}

	:global(.screen-shell[data-theme="dark"]) .stopwatch-display.running {
		color: var(--sw-active-text);
	}

	.display-main {
		font-size: calc(4rem * var(--sw-scale));
	}

	.display-cs {
		font-size: calc(1.75rem * var(--sw-scale));
		font-weight: 600;
		color: color-mix(in srgb, currentColor 60%, transparent);
		margin-left: calc(0.15rem * var(--sw-scale));
	}

	.stopwatch-actions {
		display: flex;
		flex-wrap: wrap;
		gap: calc(0.55rem * var(--sw-scale));
		justify-content: center;
		min-width: 0;
	}

	.action-button {
		display: inline-flex;
		flex: 0 1 auto;
		align-items: center;
		gap: calc(0.38rem * var(--sw-scale));
		padding: calc(0.45rem * var(--sw-scale)) calc(0.75rem * var(--sw-scale));
		border: 1px solid var(--border);
		border-radius: calc(0.45rem * var(--sw-scale));
		background: var(--surface-soft);
		color: var(--text);
		font: inherit;
		font-size: calc(0.88rem * var(--sw-scale));
		font-weight: 700;
		cursor: pointer;
		transition: background 120ms ease;
		white-space: nowrap;
	}

	.action-button.running {
		border-color: var(--sw-active-border);
		background: var(--sw-active-surface);
		color: var(--sw-active-text);
	}


	.lap-panel {
		flex: 0 0 auto;
		width: calc(8.5rem * var(--sw-scale));
		border-left: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.lap-heading {
		margin: 0;
		padding: calc(0.4rem * var(--sw-scale)) calc(0.5rem * var(--sw-scale)) calc(0.25rem * var(--sw-scale));
		font-size: calc(0.62rem * var(--sw-scale));
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		flex-shrink: 0;
	}

	.lap-list {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		overflow-y: auto;
		flex: 1;
		padding: 0 calc(0.5rem * var(--sw-scale));
		padding-bottom: calc(0.3rem * var(--sw-scale));
	}

	.lap-entry {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: calc(0.72rem * var(--sw-scale));
		color: var(--text);
		gap: 0.4rem;
	}

	.lap-number {
		color: color-mix(in srgb, var(--text) 45%, transparent);
		font-weight: 600;
		flex-shrink: 0;
	}

	.lap-time {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		white-space: nowrap;
	}

	.lap-empty {
		margin: 0;
		font-size: calc(0.7rem * var(--sw-scale));
		color: color-mix(in srgb, var(--text) 35%, transparent);
		font-style: italic;
	}
</style>
