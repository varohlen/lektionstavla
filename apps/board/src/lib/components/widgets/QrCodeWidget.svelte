<script lang="ts">
	import QRCode from 'qrcode';
	import { untrack } from 'svelte';
	import WidgetShell from './WidgetShell.svelte';

	/** Byte-mode capacity of the largest QR version. */
	const MAX_QR_LENGTH = 2953;

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		value: string;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onValueChange: (value: string) => void;
	};

	let {
		x,
		y,
		w,
		h,
		z,
		selected,
		value,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onValueChange
	}: Props = $props();

	// Seeded once; kept in sync with `value` by the effect below while unselected.
	let inputValue = $state(untrack(() => value));
	let svgContent = $state('');
	let encodeFailed = $state(false);

	function handleInput(event: Event) {
		inputValue = (event.target as HTMLInputElement).value;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			applyUrl();
		}
	}

	function applyUrl() {
		onValueChange(inputValue);
	}

	$effect(() => {
		const target = value.trim();

		if (!target) {
			svgContent = '';
			encodeFailed = false;
			return;
		}

		// Encoding is async, so a newer value must not be overwritten by an
		// older promise resolving late.
		let cancelled = false;

		QRCode.toString(target, {
			type: 'svg',
			margin: 2,
			errorCorrectionLevel: 'M',
			color: { dark: '#000000', light: '#ffffff' }
		})
			.then((svg) => {
				if (cancelled) return;
				svgContent = svg;
				encodeFailed = false;
			})
			.catch((error) => {
				if (cancelled) return;
				console.warn('Failed to encode QR code', error);
				svgContent = '';
				encodeFailed = true;
			});

		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		if (!selected) {
			inputValue = value;
		}
	});
</script>

<WidgetShell
	title="QR-kod"
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
	<div class="qr-container">
		<div class="qr-display">
			{#if svgContent}
				{@html svgContent}
			{:else if encodeFailed}
				<div class="qr-placeholder qr-placeholder--error">
					<span>Texten är för lång för en QR-kod</span>
				</div>
			{:else}
				<div class="qr-placeholder">
					<span>Ange URL</span>
				</div>
			{/if}
		</div>

		{#if selected}
			<div class="qr-input-row">
				<input
					class="qr-input"
					type="url"
					placeholder="https://..."
					maxlength={MAX_QR_LENGTH}
					value={inputValue}
					oninput={handleInput}
					onkeydown={handleKeyDown}
				/>
				<button class="qr-apply" type="button" onclick={applyUrl}>OK</button>
			</div>
		{/if}
	</div>
</WidgetShell>

<style>
	.qr-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.3rem;
		box-sizing: border-box;
	}

	.qr-display {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 0;
	}

	.qr-display :global(svg) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
	}

	.qr-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: color-mix(in srgb, var(--text) 32%, transparent);
		font-size: 0.9rem;
		padding: 0 0.5rem;
		text-align: center;
	}

	.qr-placeholder--error {
		color: color-mix(in srgb, #e53e3e 70%, var(--text));
	}

	.qr-input-row {
		display: flex;
		gap: 0.3rem;
		width: 100%;
		flex-shrink: 0;
	}

	.qr-input {
		flex: 1;
		height: 1.8rem;
		padding: 0 0.45rem;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 0.3rem;
		background: transparent;
		color: var(--text);
		font: inherit;
		font-size: 0.78rem;
		outline: none;
	}

	.qr-input:focus {
		border-color: var(--brand-primary-500);
	}

	.qr-apply {
		height: 1.8rem;
		padding: 0 0.65rem;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 0.3rem;
		background: color-mix(in srgb, var(--brand-primary-500) 12%, transparent);
		color: var(--text);
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
	}

	.qr-apply:hover {
		background: color-mix(in srgb, var(--brand-primary-500) 22%, transparent);
	}
</style>
