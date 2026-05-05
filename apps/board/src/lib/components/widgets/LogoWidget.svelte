<script lang="ts">
	import WidgetShell from './WidgetShell.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		src: string;
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
		src,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete
	}: Props = $props();
</script>

<WidgetShell
	title="Logga"
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
	<div class="logo-wrap">
		<img src={src} alt="Logotyp" class="logo" />
	</div>
</WidgetShell>

<style>
	.logo-wrap {
		display: grid;
		align-items: start;
	}

	.logo {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
