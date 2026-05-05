<script lang="ts">
	import IntrinsicTextWidgetBase from './IntrinsicTextWidgetBase.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		scaleHeight: number;
		z: number;
		selected: boolean;
		value: string;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onMeasure: (size: { width: number; height: number }) => void;
	};

	let {
		x,
		y,
		w,
		h,
		scaleHeight,
		z,
		selected,
		value,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onMeasure
	}: Props = $props();
</script>

<IntrinsicTextWidgetBase
	title="Datum"
	{x}
	{y}
	{w}
	{h}
	{scaleHeight}
	{z}
	{selected}
	value={value}
	color="var(--muted)"
	onMeasure={onMeasure}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
/>
