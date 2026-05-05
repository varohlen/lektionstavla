<script lang="ts">
	import WidgetShell from "./WidgetShell.svelte";

	type TrelsonPins = {
		start: string;
		resume: string;
		submit: string;
		close: string;
	};

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		pins: TrelsonPins;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onPinChange: (field: keyof TrelsonPins, value: string) => void;
	};

	let {
		x,
		y,
		w,
		h,
		z,
		selected,
		pins,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onPinChange,
	}: Props = $props();

	const rows: Array<{ key: keyof TrelsonPins; label: string }> = [
		{ key: "start", label: "Start" },
		{ key: "resume", label: "Återuppta" },
		{ key: "submit", label: "Lämna in" },
		{ key: "close", label: "Stänga" },
	];

	const visibleRows = $derived(
		selected
			? rows
			: rows.filter((row) => (pins[row.key] ?? "").trim().length > 0),
	);
	const sectionHeight = $derived(Math.max(44, w * 0.155));
	const sectionGap = $derived(`${sectionHeight * 0.18}px`);
	const labelSize = $derived(`${sectionHeight * 0.2}px`);
	const valueSize = $derived(`${sectionHeight * 0.28}px`);
	const inputSize = $derived(`${sectionHeight * 0.26}px`);
	const sectionPaddingY = $derived(`${sectionHeight * 0.18}px`);
	const sectionPaddingX = $derived(`${sectionHeight * 0.22}px`);
	const editLabelMin = $derived(`${sectionHeight * 1.4}px`);
	const editGap = $derived(`${sectionHeight * 0.22}px`);
	const logoSize = $derived(`${sectionHeight * 0.9}px`);
	const brandSize = $derived(`${sectionHeight * 0.28}px`);
</script>

<WidgetShell
	title="Trelson"
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
	<div
		class="trelson-widget"
		style={`grid-template-rows: repeat(${visibleRows.length + 1}, minmax(0, 1fr)); --trelson-gap:${sectionGap}; --trelson-brand-size:${brandSize}; --trelson-logo-size:${logoSize}; --trelson-label-size:${labelSize}; --trelson-value-size:${valueSize}; --trelson-input-size:${inputSize}; --trelson-section-padding-y:${sectionPaddingY}; --trelson-section-padding-x:${sectionPaddingX}; --trelson-edit-label-min:${editLabelMin}; --trelson-edit-gap:${editGap};`}
	>
		<div class="trelson-section trelson-header">
			<div class="trelson-brand">
				<span class="trelson-brand-mark" aria-hidden="true">
					<img src="/trelson.svg" alt="" />
				</span>
				<h3>TRELSON</h3>
			</div>
		</div>

		{#each visibleRows as row}
			{#if selected}
				<label class="trelson-section pin-row pin-row--edit">
					<span class="pin-label">{row.label}</span>
					<input
						class="pin-input"
						type="text"
						inputmode="numeric"
						placeholder="PIN"
						minlength="4"
						maxlength="8"
						value={pins[row.key]}
						oninput={(event) =>
							onPinChange(row.key, (event.currentTarget as HTMLInputElement).value)}
					/>
				</label>
			{:else}
				<div class="trelson-section pin-row pin-row--read">
					<span class="pin-label">{row.label}</span>
					<strong class="pin-value">{pins[row.key]}</strong>
				</div>
			{/if}
		{/each}
	</div>
</WidgetShell>

<style>
	.trelson-widget {
		--trelson-plum: #2a0f33;
		--trelson-plum-soft: #6f5a78;
		--trelson-lavender: #ebe2ef;
		--trelson-lavender-strong: #ddd1e6;
		--trelson-ink: #32143b;
		--trelson-line: color-mix(in srgb, var(--trelson-plum) 20%, transparent);
		--trelson-header-surface: color-mix(
			in srgb,
			var(--trelson-lavender) 78%,
			white 22%
		);
		--trelson-read-surface: color-mix(
			in srgb,
			var(--trelson-lavender) 22%,
			white 78%
		);
		--trelson-input-surface: color-mix(
			in srgb,
			var(--trelson-lavender) 16%,
			white 84%
		);
		display: grid;
		gap: var(--trelson-gap);
		height: 100%;
		padding: 0.3rem;
		box-sizing: border-box;
	}

	:global(.screen-shell[data-theme="dark"]) .trelson-widget {
		--trelson-lavender: #b79ac7;
		--trelson-lavender-strong: #d5c4df;
		--trelson-ink: #f6eff9;
		--trelson-line: color-mix(in srgb, var(--trelson-lavender-strong) 26%, transparent);
		--trelson-header-surface: #5d4568;
		--trelson-read-surface: #2b2237;
		--trelson-input-surface: #342a40;
	}

	.trelson-section {
		display: grid;
		align-content: center;
		min-height: 0;
		padding: var(--trelson-section-padding-y) var(--trelson-section-padding-x);
		border: 1px solid var(--trelson-line);
		border-radius: 1rem;
		background: var(--trelson-read-surface);
		box-sizing: border-box;
	}

	:global(.screen-shell[data-theme="dark"]) .trelson-section {
		box-shadow: inset 0 1px 0 color-mix(in srgb, white 12%, transparent);
	}

	.trelson-header {
		background: linear-gradient(
			180deg,
			color-mix(in srgb, var(--trelson-plum) 94%, black 6%) 0%,
			color-mix(in srgb, var(--trelson-plum) 82%, var(--trelson-header-surface) 18%) 100%
		);
		border-color: color-mix(in srgb, var(--trelson-plum) 52%, transparent);
		box-shadow:
			inset 0 1px 0 color-mix(in srgb, white 12%, transparent),
			0 0.2rem 0.5rem color-mix(in srgb, var(--trelson-plum) 18%, transparent);
	}

	.trelson-brand {
		display: inline-flex;
		align-items: center;
		gap: clamp(0.45rem, 1vw, 0.7rem);
	}

	.trelson-brand-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--trelson-logo-size);
		height: var(--trelson-logo-size);
		border-radius: 0.8rem;
		overflow: hidden;
		flex: 0 0 auto;
	}

	.trelson-brand-mark img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: left center;
		transform: scale(1.18);
		transform-origin: left center;
	}

	.trelson-header h3 {
		margin: 0;
		font-size: var(--trelson-brand-size);
		line-height: 1;
		font-weight: 800;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: white;
	}

	.pin-row {
		gap: 0.25rem;
	}

	.pin-row--edit {
		grid-template-columns: minmax(var(--trelson-edit-label-min), 0.9fr) minmax(0, 1.4fr);
		align-items: center;
		gap: var(--trelson-edit-gap);
	}

	.pin-row--read {
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		align-content: center;
		gap: clamp(0.75rem, 1.2vw, 1.4rem);
		background: var(--trelson-read-surface);
		border-color: color-mix(in srgb, var(--trelson-plum) 12%, transparent);
		box-shadow: inset 0 1px 0 color-mix(in srgb, white 55%, transparent);
	}

	:global(.screen-shell[data-theme="dark"]) .pin-row--read {
		box-shadow: inset 0 1px 0 color-mix(in srgb, white 8%, transparent);
	}

	.pin-label {
		font-size: var(--trelson-label-size);
		font-weight: 700;
		color: color-mix(in srgb, var(--trelson-plum-soft) 76%, var(--trelson-ink) 24%);
	}

	:global(.screen-shell[data-theme="dark"]) .pin-label {
		color: color-mix(in srgb, var(--trelson-lavender-strong) 72%, white 28%);
	}

	.pin-input {
		width: 100%;
		min-width: 0;
		max-width: none;
		padding: 0.68rem 0.82rem;
		border: 1px solid color-mix(in srgb, var(--trelson-plum) 14%, transparent);
		border-radius: 1rem;
		background: var(--trelson-input-surface);
		color: var(--trelson-ink);
		font: inherit;
		font-size: var(--trelson-input-size);
		font-weight: 700;
		letter-spacing: 0.12em;
		box-sizing: border-box;
	}

	.pin-input:focus {
		outline: none;
		border-color: color-mix(in srgb, var(--trelson-plum) 38%, transparent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--trelson-lavender) 50%, transparent);
	}

	.pin-value {
		font-size: var(--trelson-value-size);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--trelson-ink);
		text-align: right;
		white-space: nowrap;
	}

	.pin-input::placeholder {
		color: color-mix(in srgb, var(--trelson-ink) 28%, transparent);
		letter-spacing: 0.08em;
	}

</style>
