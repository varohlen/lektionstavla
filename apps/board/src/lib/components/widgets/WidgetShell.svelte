<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { tooltip } from 'svooltip';
	import 'svooltip/styles.css';

	type Props = {
		title: string;
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		chrome?: boolean;
		fitContentWidth?: boolean;
		allowBodyOverflow?: boolean;
		dragFromEditable?: boolean;
		background?: string;
		color?: string;
		borderColor?: string;
		selected?: boolean;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		toolbarActions?: import('svelte').Snippet<
			[{ horizontal: 'left' | 'right'; vertical: 'top' | 'bottom' }]
		>;
		children: import('svelte').Snippet;
	};

	let {
		title,
		x,
		y,
		w,
		h,
		z,
		chrome = true,
		fitContentWidth = false,
		allowBodyOverflow = false,
		dragFromEditable = false,
		background,
		color,
		borderColor,
		selected = false,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		toolbarActions,
		children
	}: Props = $props();

	let toolbarElement = $state<HTMLDivElement | null>(null);
	let widgetElement = $state<HTMLDivElement | null>(null);
	let viewportWidth = $state(0);
	let viewportHeight = $state(0);
	let toolbarHorizontal = $state<'left' | 'right'>('right');
	let toolbarVertical = $state<'top' | 'bottom'>('bottom');
	let toolbarOffsetX = $state(0);
	let toolbarHeight = $state(48);
	let resizeCorner = $state<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
	let pendingEditableDragCleanup: (() => void) | null = null;

	const editableDragThreshold = 5;

	function syncViewport() {
		if (typeof window === 'undefined') return;
		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;
	}

	function clearPendingEditableDrag() {
		pendingEditableDragCleanup?.();
		pendingEditableDragCleanup = null;
	}

	function startEditableDragWhenIntentional(event: PointerEvent) {
		clearPendingEditableDrag();

		const startX = event.clientX;
		const startY = event.clientY;
		const pointerId = event.pointerId;

		function handleMove(moveEvent: PointerEvent) {
			if (moveEvent.pointerId !== pointerId) return;

			const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
			if (distance < editableDragThreshold) return;

			moveEvent.preventDefault();
			window.getSelection()?.removeAllRanges();
			clearPendingEditableDrag();
			onMoveStart(moveEvent);
		}

		function handleEnd(endEvent: PointerEvent) {
			if (endEvent.pointerId !== pointerId) return;
			clearPendingEditableDrag();
		}

		window.addEventListener('pointermove', handleMove, { passive: false });
		window.addEventListener('pointerup', handleEnd);
		window.addEventListener('pointercancel', handleEnd);

		pendingEditableDragCleanup = () => {
			window.removeEventListener('pointermove', handleMove);
			window.removeEventListener('pointerup', handleEnd);
			window.removeEventListener('pointercancel', handleEnd);
		};
	}

	function handlePointerDown(event: PointerEvent) {
		event.stopPropagation();
		onSelect();

		const target = event.target instanceof HTMLElement ? event.target : widgetElement;
		if (!target) return;

		const isContentEditable = target.closest('[contenteditable="true"]');
		const isFormControl = target.closest('input, textarea, select, a');
		const isEditable = isContentEditable || isFormControl;

		if (!selected) {
			if (!isEditable) event.preventDefault();
			return;
		}
		if (target.closest('button')) return;
		if (isFormControl) return;
		if (isContentEditable) {
			if (dragFromEditable) {
				startEditableDragWhenIntentional(event);
			}
			return;
		}

		event.preventDefault();
		onMoveStart(event);
	}

	function handleResizePointerDown(event: PointerEvent) {
		event.stopPropagation();
		event.preventDefault();
		onSelect();
		onResizeStart(event);
	}

	function handleSendBackward(event: MouseEvent) {
		event.stopPropagation();
		onSendBackward();
	}

	function handleBringForward(event: MouseEvent) {
		event.stopPropagation();
		onBringForward();
	}

	function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		onDelete?.();
	}

	onMount(() => {
		syncViewport();
		window.addEventListener('resize', syncViewport);

		return () => window.removeEventListener('resize', syncViewport);
	});

	onDestroy(() => {
		clearPendingEditableDrag();
	});

	$effect(() => {
		if (!selected) return;
		if (!toolbarElement) return;
		if (!widgetElement) return;

		const toolbarWidth = toolbarElement.offsetWidth;
		const measuredToolbarHeight = toolbarElement.offsetHeight;
		const edgePadding = 16;
		const widgetWidth = widgetElement.offsetWidth || w;
		const centeredOffset = (widgetWidth - toolbarWidth) / 2;
		const minOffset = edgePadding - x;
		const maxOffset = viewportWidth - edgePadding - x - toolbarWidth;
		const clampedOffset = Math.min(Math.max(centeredOffset, minOffset), maxOffset);
		const outsideBottom = y + h + measuredToolbarHeight + edgePadding > viewportHeight;

		toolbarOffsetX = Number.isFinite(clampedOffset) ? clampedOffset : 0;
		toolbarHorizontal = x + toolbarOffsetX + toolbarWidth / 2 > viewportWidth / 2 ? 'right' : 'left';
		toolbarVertical = outsideBottom ? 'top' : 'bottom';
		toolbarHeight = measuredToolbarHeight;

		const handleSize = 24;
		const nearRight = x + widgetWidth + handleSize > viewportWidth;
		const nearBottom = y + h + handleSize > viewportHeight;

		if (nearRight && nearBottom) resizeCorner = 'top-left';
		else if (nearRight) resizeCorner = 'bottom-left';
		else if (nearBottom) resizeCorner = 'top-right';
		else resizeCorner = 'bottom-right';
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={widgetElement}
	class:frameless={!chrome}
	class:selected
	class="widget"
	style={`${
		fitContentWidth ? "" : `width:${w}px;`
	}height:${h}px;left:${x}px;top:${y}px;z-index:${z};${
		background ? `background:${background};` : ""
	}${color ? `color:${color};` : ""}${borderColor ? `border-color:${borderColor};` : ""}`}
	onpointerdown={handlePointerDown}
>
	<div class:allow-overflow={allowBodyOverflow} class="widget-body">
		{@render children()}
	</div>

	{#if selected}
		<div
			bind:this={toolbarElement}
			class:top={toolbarVertical === 'top'}
			class="widget-toolbar"
			style={`--toolbar-offset-x:${toolbarOffsetX}px;--toolbar-height:${toolbarHeight}px;`}
			transition:fly={{ y: toolbarVertical === 'top' ? -4 : 4, duration: 120 }}
		>
			<span class="widget-title">{title}</span>

			<span class="toolbar-divider"></span>

			<div class="widget-actions">
				{#if toolbarActions}
					{@render toolbarActions({
						horizontal: toolbarHorizontal,
						vertical: toolbarVertical
					})}
					<span class="toolbar-divider"></span>
				{/if}

				<button
					class="toolbar-button"
					type="button"
					aria-label={`Flytta ${title} bakåt`}
					use:tooltip={{ content: 'Flytta bakåt', placement: 'top', offset: 6 }}
					onclick={handleSendBackward}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<rect x="3" y="3" width="11" height="11" rx="2" stroke-width="1.8" fill="currentColor" opacity="0.25" />
						<rect x="10" y="10" width="11" height="11" rx="2" stroke-width="1.8" fill="currentColor" />
					</svg>
				</button>
				<button
					class="toolbar-button"
					type="button"
					aria-label={`Flytta ${title} framåt`}
					use:tooltip={{ content: 'Flytta framåt', placement: 'top', offset: 6 }}
					onclick={handleBringForward}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<rect x="10" y="10" width="11" height="11" rx="2" stroke-width="1.8" fill="currentColor" opacity="0.25" />
						<rect x="3" y="3" width="11" height="11" rx="2" stroke-width="1.8" fill="currentColor" />
					</svg>
				</button>

				<span class="toolbar-divider"></span>

				<button
					aria-label={`Ta bort ${title}`}
					class="toolbar-button delete-button"
					type="button"
					use:tooltip={{ content: 'Ta bort', placement: 'top', offset: 6 }}
					onclick={handleDelete}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
					</svg>
				</button>
			</div>
		</div>

		<!-- Resize corner handle -->
		<button
			class="resize-handle resize-{resizeCorner}"
			type="button"
			aria-label={`Ändra storlek på ${title}`}
			use:tooltip={{ content: 'Ändra storlek', placement: 'top', offset: 6 }}
			onpointerdown={handleResizePointerDown}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				{#if resizeCorner === 'bottom-right'}
					<path d="M21 15l-6 6M21 9l-12 12" />
				{:else if resizeCorner === 'bottom-left'}
					<path d="M3 15l6 6M3 9l12 12" />
				{:else if resizeCorner === 'top-right'}
					<path d="M21 9l-6-6M21 15L9 3" />
				{:else}
					<path d="M3 9l6-6M3 15L15 3" />
				{/if}
			</svg>
		</button>
	{/if}
</div>

<style>
	.widget {
		position: absolute;
		display: grid;
		align-content: start;
		gap: 1rem;
		padding: 1rem;
		box-sizing: border-box;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: var(--surface);
		box-shadow: var(--shadow);
		overflow: visible;
		cursor: default;
		user-select: none;
		touch-action: none;
		transition: box-shadow 160ms ease, border-color 160ms ease;
	}

	.widget.selected {
		box-shadow:
			0 0 0 2px color-mix(in srgb, var(--brand-primary-500) 52%, transparent),
			var(--shadow);
	}

	.widget.frameless {
		gap: 0.35rem;
		padding: 0;
		padding-left: 0;
		border: none;
		border-left: none;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
		overflow: visible;
	}

	.widget.frameless.selected {
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary-500) 52%, transparent);
		border-radius: 0.75rem;
	}

	.widget-toolbar {
		position: absolute;
		left: var(--toolbar-offset-x, 0);
		right: auto;
		bottom: calc((var(--toolbar-height, 48px) + 0.5rem) * -1);
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		max-width: calc(100vw - 2rem);
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: 0.6rem;
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--shadow);
		white-space: normal;
	}

	.widget-toolbar.top {
		top: calc((var(--toolbar-height, 48px) + 0.5rem) * -1);
		bottom: auto;
	}

	.widget-title {
		font: inherit;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0 0.15rem;
	}

	.toolbar-divider {
		width: 1px;
		height: 1.2rem;
		background: var(--border);
		flex-shrink: 0;
		pointer-events: none;
	}

	.widget-actions {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	@keyframes toolbar-btn-in {
		0% {
			opacity: 0;
			transform: scale(0.85);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	.toolbar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.7rem;
		height: 1.7rem;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--brand-primary-500) 18%, var(--border));
		border-radius: 0.4rem;
		background: color-mix(in srgb, var(--brand-primary-500) 5%, var(--surface-soft));
		color: color-mix(in srgb, var(--text) 65%, transparent);
		cursor: pointer;
		transition: background 120ms ease, color 120ms ease, border-color 120ms ease, transform 80ms ease;
		animation: toolbar-btn-in 200ms ease both;
	}

	.toolbar-button:hover {
		background: color-mix(in srgb, var(--brand-primary-500) 14%, var(--surface-soft));
		border-color: color-mix(in srgb, var(--brand-primary-500) 30%, var(--border));
		color: var(--text);
	}

	.toolbar-button:active {
		transform: scale(0.92);
	}

	.toolbar-button svg {
		width: 0.9rem;
		height: 0.9rem;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}

	.delete-button {
		border-color: color-mix(in srgb, #e53e3e 15%, var(--border));
		background: color-mix(in srgb, #e53e3e 4%, var(--surface-soft));
		color: color-mix(in srgb, #e53e3e 60%, var(--muted));
	}

	.delete-button:hover {
		background: color-mix(in srgb, #e53e3e 12%, var(--surface-soft));
		border-color: color-mix(in srgb, #e53e3e 35%, var(--border));
		color: #e53e3e;
	}

	.widget-body {
		min-height: 0;
		height: 100%;
		overflow: hidden;
		border-radius: inherit;
	}

	.widget-body.allow-overflow {
		overflow: visible;
	}

	.resize-handle {
		position: absolute;
		width: 1.4rem;
		height: 1.4rem;
		padding: 0.2rem;
		border: 1px solid var(--border);
		border-radius: 0.35rem;
		background: var(--surface);
		color: var(--muted);
		touch-action: none;
		transition: color 120ms ease, background 120ms ease;
		z-index: 1;
	}

	.resize-handle:hover {
		background: color-mix(in srgb, var(--brand-primary-500) 10%, var(--surface));
		color: var(--brand-primary-500);
	}

	.resize-handle svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-width: 2;
	}

	.resize-bottom-right {
		bottom: -0.35rem;
		right: -0.35rem;
		cursor: nwse-resize;
	}

	.resize-bottom-left {
		bottom: -0.35rem;
		left: -0.35rem;
		cursor: nesw-resize;
	}

	.resize-top-right {
		top: -0.35rem;
		right: -0.35rem;
		cursor: nesw-resize;
	}

	.resize-top-left {
		top: -0.35rem;
		left: -0.35rem;
		cursor: nwse-resize;
	}
</style>
