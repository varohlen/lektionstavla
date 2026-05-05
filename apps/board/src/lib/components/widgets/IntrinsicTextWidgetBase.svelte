<script lang="ts">
	import { onMount } from 'svelte';
	import WidgetShell from './WidgetShell.svelte';
	import { getIntrinsicTextMetrics } from './intrinsicTextMetrics';

	type Props = {
		title: string;
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		value: string;
		scaleHeight?: number;
		fontFamily?: string;
		fontWeight?: number | string;
		lineHeight?: string;
		letterSpacing?: string;
		offsetX?: string;
		offsetY?: string;
		color?: string;
		background?: string;
		borderRadius?: string;
		editable?: boolean;
		ariaLabel?: string;
		className?: string;
		multiline?: boolean;
		toolbarActions?: import('svelte').Snippet<
			[{ horizontal: 'left' | 'right'; vertical: 'top' | 'bottom' }]
		>;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onMeasure: (size: { width: number; height: number }) => void;
		onInput?: (value: string) => void;
		onBlur?: (value: string, element: HTMLDivElement) => void;
	};

	let {
		title,
		x,
		y,
		w,
		h,
		z,
		selected,
		value,
		scaleHeight = h,
		fontFamily = 'var(--font-body)',
		fontWeight = 700,
		lineHeight = '0.92',
		letterSpacing = '-0.035em',
		offsetX = '0px',
		offsetY = '0px',
		color = 'var(--text)',
		background = 'transparent',
		borderRadius = '0px',
		editable = false,
		ariaLabel = title,
		className = '',
		multiline = false,
		toolbarActions,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onMeasure,
		onInput,
		onBlur
	}: Props = $props();

	let contentElement = $state<HTMLDivElement | null>(null);
	const metrics = $derived(getIntrinsicTextMetrics(scaleHeight));
	const fontSize = $derived(`${metrics.fontSize}px`);
	const padding = $derived(`${metrics.paddingBlock}px ${metrics.paddingInline}px`);
	const textStyle = $derived(
		`font-size:${fontSize};padding:${padding};font-family:${fontFamily};font-weight:${fontWeight};line-height:${lineHeight};letter-spacing:${letterSpacing};color:${color};background:${background};border-radius:${borderRadius};transform:translate(${offsetX}, ${offsetY});`
	);

	function getNormalizedValue(text: string) {
		if (multiline) {
			return text
				.replace(/\r\n/g, '\n')
				.replace(/\u00a0/g, ' ')
				.replace(/\n{3,}/g, '\n\n')
				.trim();
		}

		return text.replace(/\s+/g, ' ').trim();
	}

	function syncWidth() {
		if (!contentElement) return;
		const rect = contentElement.getBoundingClientRect();
		onMeasure({
			width: Math.ceil(rect.width),
			height: Math.ceil(rect.height)
		});
	}

	function handleInput(event: Event) {
		if (!onInput) return;

		const target = event.currentTarget as HTMLDivElement;
		onInput(getNormalizedValue(target.innerText || target.textContent || ''));
	}

	function handleBlur(event: FocusEvent) {
		if (!onBlur) return;

		const target = event.currentTarget as HTMLDivElement;
		onBlur(getNormalizedValue(target.innerText || target.textContent || ''), target);
	}

	onMount(() => {
		if (!contentElement) return;

		syncWidth();

		const observer = new ResizeObserver(() => syncWidth());
		observer.observe(contentElement);

		return () => observer.disconnect();
	});

	$effect(() => {
		if (!contentElement) return;
		if (contentElement.textContent === value) return;
		contentElement.textContent = value;
		syncWidth();
	});
</script>

<WidgetShell
	{title}
	{x}
	{y}
	{w}
	{h}
	{z}
	chrome={false}
	fitContentWidth={true}
	allowBodyOverflow={true}
	dragFromEditable={editable}
	{selected}
	{toolbarActions}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
>
	<div
		bind:this={contentElement}
		class={`intrinsic-text ${className}`.trim()}
		class:multiline
		contenteditable={editable ? 'true' : undefined}
		role={editable ? 'textbox' : undefined}
		aria-label={ariaLabel}
		spellcheck={editable ? 'false' : undefined}
		style={textStyle}
		oninput={handleInput}
		onblur={handleBlur}
	>
		{value}
	</div>
</WidgetShell>

<style>
	.intrinsic-text {
		display: inline-grid;
		place-items: center;
		min-height: 100%;
		width: max-content;
		box-sizing: border-box;
		text-align: center;
		white-space: nowrap;
		outline: none;
	}

	.intrinsic-text.multiline {
		width: fit-content;
		max-width: 100%;
		white-space: pre-wrap;
	}
</style>
