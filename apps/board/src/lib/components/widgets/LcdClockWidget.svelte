<script lang="ts">
	import WidgetShell from './WidgetShell.svelte';
	import LcdDigit from './LcdDigit.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		time: string;
		seconds: number;
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
		time,
		seconds,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete
	}: Props = $props();

	const hours = $derived(time.slice(0, 2));
	const minutes = $derived(time.slice(3, 5));
	const secs = $derived(String(seconds).padStart(2, '0'));
</script>

<WidgetShell
	title="LCD-klocka"
	{x}
	{y}
	{w}
	{h}
	{z}
	chrome={false}
	{selected}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
>
	<svg class="lcd" viewBox="0 0 264 100">
		<!-- Bezel -->
		<rect class="lcd-bezel" x="0" y="0" width="264" height="100" rx="8" />

		<!-- Screen -->
		<rect class="lcd-screen" x="10" y="10" width="244" height="80" rx="4" />

		<!-- Hour digit 1 -->
		<svg x="20" y="16" width="34" height="68"><LcdDigit number={hours[0]} /></svg>
		<!-- Hour digit 2 -->
		<svg x="58" y="16" width="34" height="68"><LcdDigit number={hours[1]} /></svg>

		<!-- Colon -->
		<circle class="lcd-dot" cx="102" cy="40" r="2.5" />
		<circle class="lcd-dot" cx="102" cy="60" r="2.5" />

		<!-- Minute digit 1 -->
		<svg x="112" y="16" width="34" height="68"><LcdDigit number={minutes[0]} /></svg>
		<!-- Minute digit 2 -->
		<svg x="150" y="16" width="34" height="68"><LcdDigit number={minutes[1]} /></svg>

		<!-- Small colon -->
		<circle class="lcd-dot" cx="193" cy="42" r="1.8" />
		<circle class="lcd-dot" cx="193" cy="58" r="1.8" />

		<!-- Second digit 1 -->
		<svg x="202" y="24" width="24" height="52"><LcdDigit number={secs[0]} /></svg>
		<!-- Second digit 2 -->
		<svg x="228" y="24" width="24" height="52"><LcdDigit number={secs[1]} /></svg>
	</svg>
</WidgetShell>

<style>
	.lcd {
		width: 100%;
		height: 100%;

		/* Light: Casio style */
		--lcd-segment-active: #2a3a2e;
		--lcd-segment-stroke: #1e2e22;
		--lcd-dim: rgba(42, 58, 46, 0.08);
	}

	:global(.screen-shell[data-theme='dark']) .lcd {
		--lcd-segment-active: #7aff9a;
		--lcd-segment-stroke: #5ad878;
		--lcd-dim: rgba(122, 255, 154, 0.06);
	}

	.lcd-bezel {
		fill: #3a3a3a;
	}

	:global(.screen-shell[data-theme='dark']) .lcd-bezel {
		fill: #0e1a10;
	}

	.lcd-screen {
		fill: #c8d8c4;
	}

	:global(.screen-shell[data-theme='dark']) .lcd-screen {
		fill: #1a2e1e;
	}

	.lcd-dot {
		fill: var(--lcd-segment-active);
	}
</style>
