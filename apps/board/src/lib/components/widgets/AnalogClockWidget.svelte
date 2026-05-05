<script lang="ts">
	import WidgetShell from './WidgetShell.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		hourAngle: number;
		minuteAngle: number;
		secondAngle: number;
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
		hourAngle,
		minuteAngle,
		secondAngle,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete
	}: Props = $props();

	const CX = 50;
	const CY = 50;
	const FACE_RADIUS = 44;
	const TICK_OUTER = 40;
	const MINOR_TICK_INNER = 37.5;
	const MAJOR_TICK_INNER = 35;
	const LABEL_RADIUS = 30;
	const HOUR_HAND_LENGTH = 20;
	const MINUTE_HAND_LENGTH = 28;
	const SECOND_HAND_LENGTH = 32;

	type Tick = { x1: number; y1: number; x2: number; y2: number; major: boolean };
	type Label = { value: number; x: number; y: number };

	function polar(radius: number, angleDeg: number) {
		const rad = (angleDeg * Math.PI) / 180;
		return { x: CX + Math.cos(rad) * radius, y: CY + Math.sin(rad) * radius };
	}

	const ticks: Tick[] = Array.from({ length: 60 }, (_, i) => {
		const angle = -90 + i * 6;
		const major = i % 5 === 0;
		const outer = polar(TICK_OUTER, angle);
		const inner = polar(major ? MAJOR_TICK_INNER : MINOR_TICK_INNER, angle);
		return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major };
	});

	const labels: Label[] = Array.from({ length: 12 }, (_, i) => {
		const hour = i === 0 ? 12 : i;
		const angle = -90 + i * 30;
		const pos = polar(LABEL_RADIUS, angle);
		return { value: hour, x: pos.x, y: pos.y };
	});

	function handEnd(length: number, angleDeg: number) {
		const angle = -90 + angleDeg;
		return polar(length, angle);
	}

	const hourTip = $derived(handEnd(HOUR_HAND_LENGTH, hourAngle));
	const minuteTip = $derived(handEnd(MINUTE_HAND_LENGTH, minuteAngle));
	const secondTip = $derived(handEnd(SECOND_HAND_LENGTH, secondAngle));
	const secondTail = $derived(handEnd(-6, secondAngle));
</script>

<WidgetShell
	title="Analog"
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
	<div class="analog-clock" aria-label="Analog klocka">
		<svg class="clock-svg" viewBox="0 0 100 100">
			<!-- Face -->
			<circle class="clock-face" cx={CX} cy={CY} r={FACE_RADIUS} />

			<!-- Ticks -->
			{#each ticks as tick}
				<line
					class="clock-tick"
					class:major={tick.major}
					x1={tick.x1} y1={tick.y1}
					x2={tick.x2} y2={tick.y2}
				/>
			{/each}

			<!-- Labels -->
			{#each labels as label}
				<text class="clock-label" x={label.x} y={label.y}>{label.value}</text>
			{/each}

			<!-- Hour hand -->
			<line
				class="hand hand-hour"
				x1={CX} y1={CY}
				x2={hourTip.x} y2={hourTip.y}
			/>

			<!-- Minute hand -->
			<line
				class="hand hand-minute"
				x1={CX} y1={CY}
				x2={minuteTip.x} y2={minuteTip.y}
			/>

			<!-- Second hand -->
			<line
				class="hand hand-second"
				x1={secondTail.x} y1={secondTail.y}
				x2={secondTip.x} y2={secondTip.y}
			/>

			<!-- Center knob -->
			<circle class="clock-knob" cx={CX} cy={CY} r="2.2" />
			<circle class="clock-knob-inner" cx={CX} cy={CY} r="1" />
		</svg>
	</div>
</WidgetShell>

<style>
	.analog-clock {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
	}

	.clock-svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.clock-face {
		fill: white;
		stroke: color-mix(in srgb, var(--text) 14%, transparent);
		stroke-width: 1.2;
	}

	:global(.screen-shell[data-theme="dark"]) .clock-face {
		fill: color-mix(in srgb, var(--surface) 90%, white);
	}

	.clock-tick {
		stroke: color-mix(in srgb, var(--text) 20%, transparent);
		stroke-width: 0.4;
		stroke-linecap: round;
	}

	.clock-tick.major {
		stroke: color-mix(in srgb, var(--text) 50%, transparent);
		stroke-width: 0.7;
	}

	.clock-label {
		font-size: 5.5px;
		font-family: var(--font-body);
		font-weight: 700;
		fill: color-mix(in srgb, var(--text) 72%, transparent);
		text-anchor: middle;
		dominant-baseline: central;
	}

	.hand {
		stroke-linecap: round;
	}

	.hand-hour {
		stroke: var(--text);
		stroke-width: 2.4;
	}

	.hand-minute {
		stroke: var(--text);
		stroke-width: 1.6;
	}

	.hand-second {
		stroke: var(--brand-danger-700);
		stroke-width: 0.6;
	}

	.clock-knob {
		fill: var(--text);
	}

	.clock-knob-inner {
		fill: var(--brand-danger-700);
	}
</style>
