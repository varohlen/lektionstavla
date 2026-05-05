<script lang="ts">
	import IntrinsicTextWidgetBase from './IntrinsicTextWidgetBase.svelte';
	import {
		TEXT_WIDGET_BACKGROUND_VARIANTS,
		TEXT_WIDGET_COLOR_VARIANTS,
		type TextWidgetBackgroundVariant,
		type TextWidgetColorVariant,
		type TextWidgetFontVariant
	} from '$lib/theme';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		scaleHeight: number;
		z: number;
		selected: boolean;
		isDark: boolean;
		value: string;
		font: TextWidgetFontVariant;
		background: TextWidgetBackgroundVariant;
		color: TextWidgetColorVariant;
		fontLabels: Record<TextWidgetFontVariant, string>;
		backgroundLabels: Record<TextWidgetBackgroundVariant, string>;
		colorLabels: Record<TextWidgetColorVariant, string>;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onMeasure: (size: { width: number; height: number }) => void;
		onToggleFont: () => void;
		onBackgroundSelect: (background: TextWidgetBackgroundVariant) => void;
		onColorSelect: (color: TextWidgetColorVariant) => void;
		onValueChange: (value: string) => void;
	};

	let {
		x,
		y,
		w,
		h,
		scaleHeight,
		z,
		selected,
		isDark,
		value,
		font,
		background,
		color,
		fontLabels,
		backgroundLabels,
		colorLabels,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onMeasure,
		onToggleFont,
		onBackgroundSelect,
		onColorSelect,
		onValueChange
	}: Props = $props();

	type OpenPicker = 'style' | null;
	type PaletteColor = {
		name: string;
		value: string;
	};

	let openPicker = $state<OpenPicker>(null);
	let stylePickerElement = $state<HTMLDivElement | null>(null);
	const resolvedColorCache = new Map<string, string>();

	const textFontFamily = $derived(
		font === 'display' ? 'var(--font-display)' : 'var(--font-body)'
	);
	const lineHeight = $derived(font === 'display' ? '1.02' : '0.92');
	const letterSpacing = $derived(font === 'display' ? '-0.01em' : '-0.035em');
	const fontWeight = $derived(font === 'display' ? 400 : 700);
	const currentFontLabel = $derived(fontLabels[font]);
	const currentBackgroundLabel = $derived(backgroundLabels[background]);
	const currentColorLabel = $derived(colorLabels[color]);

	function getBackgroundValue(variant: TextWidgetBackgroundVariant) {
		switch (variant) {
			case 'surface':
				return isDark
					? 'color-mix(in srgb, var(--surface) 78%, white 22%)'
					: 'color-mix(in srgb, var(--surface) 92%, white 8%)';
			case 'primary':
				return isDark
					? 'color-mix(in srgb, var(--brand-primary-500) 72%, var(--surface))'
					: 'var(--brand-primary-600)';
			case 'warm':
				return isDark
					? 'color-mix(in srgb, var(--brand-warm-500) 74%, var(--surface))'
					: 'var(--brand-warm-600)';
			case 'success':
				return isDark
					? 'color-mix(in srgb, var(--brand-success-500) 76%, var(--surface))'
					: 'var(--brand-success-600)';
			case 'danger':
				return isDark
					? 'color-mix(in srgb, var(--brand-danger-500) 74%, var(--surface))'
					: 'var(--brand-danger-600)';
			case 'none':
			default:
				return 'transparent';
		}
	}

	function getColorValue(variant: TextWidgetColorVariant) {
		if (variant === 'default') {
			return 'var(--text)';
		}

		switch (variant) {
			case 'inverse':
				return isDark ? 'var(--brand-primary-900)' : 'white';
			case 'primary':
				return isDark ? 'var(--brand-primary-300)' : 'var(--brand-primary-700)';
			case 'warm':
				return isDark ? 'var(--brand-warm-300)' : 'var(--brand-warm-700)';
			case 'success':
				return isDark ? 'var(--brand-success-300)' : 'var(--brand-success-700)';
			case 'danger':
				return isDark ? 'var(--brand-danger-300)' : 'var(--brand-danger-700)';
			default:
				return 'var(--text)';
		}
	}

	function resolveCssColor(expression: string, property: 'color' | 'backgroundColor') {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return expression;
		}

		const cacheKey = `${isDark ? 'dark' : 'light'}:${property}:${expression}`;
		const cached = resolvedColorCache.get(cacheKey);
		if (cached !== undefined) {
			return cached;
		}

		const colorScope =
			document.querySelector('.screen-shell[data-theme]') ??
			document.querySelector('.screen-shell') ??
			document.body;
		const probe = document.createElement('div');
		probe.style.position = 'absolute';
		probe.style.pointerEvents = 'none';
		probe.style.opacity = '0';
		probe.style[property] = expression;
		colorScope.appendChild(probe);

		const computed = getComputedStyle(probe)[property];
		probe.remove();

		const resolved = computed || expression;
		resolvedColorCache.set(cacheKey, resolved);
		return resolved;
	}

	const textBackground = $derived(getBackgroundValue(background));
	const textColor = $derived(getColorValue(color));
	const textBorderRadius = $derived(background === 'none' ? '0px' : '0.28em');
	const backgroundPaletteColors = $derived<PaletteColor[]>(
		TEXT_WIDGET_BACKGROUND_VARIANTS.filter((variant) => variant !== 'none').map((variant) => ({
			name: backgroundLabels[variant],
			value: resolveCssColor(getBackgroundValue(variant), 'backgroundColor')
		}))
	);
	const colorPaletteColors = $derived<PaletteColor[]>(
		TEXT_WIDGET_COLOR_VARIANTS.map((variant) => ({
			name: colorLabels[variant],
			value:
				variant === 'default'
					? resolveCssColor('var(--text)', 'color')
					: resolveCssColor(getColorValue(variant), 'color')
	}))
	);
	const selectedBackgroundSwatch = $derived(
		background === 'none'
			? null
			: resolveCssColor(getBackgroundValue(background), 'backgroundColor')
	);
	const selectedColorSwatch = $derived(
		color === 'default'
			? resolveCssColor('var(--text)', 'color')
			: resolveCssColor(getColorValue(color), 'color')
	);

	function togglePicker(kind: Exclude<OpenPicker, null>) {
		openPicker = openPicker === kind ? null : kind;
	}

	function handlePickerButtonPointerDown(event: PointerEvent, kind: Exclude<OpenPicker, null>) {
		event.stopPropagation();
		togglePicker(kind);
	}

	function closePickers() {
		openPicker = null;
	}

	function handleDocumentPointerDown(event: PointerEvent) {
		const target = event.target;

		if (!(target instanceof Node)) {
			return;
		}

		if (stylePickerElement?.contains(target)) {
			return;
		}

		closePickers();
	}

	function handleBackgroundPaletteSelect(selection: { color: string | null }) {
		if (selection.color === null) {
			onBackgroundSelect('none');
			closePickers();
			return;
		}

		const nextBackground = TEXT_WIDGET_BACKGROUND_VARIANTS.find(
			(variant) =>
				variant !== 'none' &&
				resolveCssColor(getBackgroundValue(variant), 'backgroundColor') === selection.color
		);

		if (nextBackground) {
			onBackgroundSelect(nextBackground);
		}

		closePickers();
	}

	function handleColorPaletteSelect(selection: { color: string | null }) {
		const selectedSwatch = selection.color;

		if (!selectedSwatch) {
			return;
		}

		const nextColor = TEXT_WIDGET_COLOR_VARIANTS.find((variant) => {
			const swatch =
				variant === 'default'
					? resolveCssColor('var(--text)', 'color')
					: resolveCssColor(getColorValue(variant), 'color');
			return swatch === selectedSwatch;
		});

		if (nextColor) {
			onColorSelect(nextColor);
		}

		closePickers();
	}

	function handleBlur(nextValue: string, element: HTMLDivElement) {
		if (!nextValue) {
			element.textContent = 'Skriv rubrik';
			onValueChange('Skriv rubrik');
			return;
		}

		onValueChange(nextValue);
	}
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<IntrinsicTextWidgetBase
	title="Rubrik"
	{x}
	{y}
	{w}
	{h}
	{scaleHeight}
	{z}
	{selected}
	value={value}
	fontFamily={textFontFamily}
	fontWeight={fontWeight}
	background={textBackground}
	color={textColor}
	borderRadius={textBorderRadius}
	{lineHeight}
	{letterSpacing}
	editable={true}
	multiline={true}
	ariaLabel="Redigera rubrik"
	className={font === 'display' ? 'display-font' : ''}
	onMeasure={onMeasure}
	onInput={onValueChange}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
	onBlur={handleBlur}
>
	{#snippet toolbarActions(toolbarPlacement)}
		<div bind:this={stylePickerElement} class="picker-control">
			<button
				class:picker-open={openPicker === 'style'}
				class="toolbar-button style-menu-button"
				type="button"
				aria-expanded={openPicker === 'style'}
				aria-label={`Öppna stilinställningar för rubriken. Bakgrund ${currentBackgroundLabel}, textfärg ${currentColorLabel}, typsnitt ${currentFontLabel}.`}
				title="Stil"
				onpointerdown={(event) => handlePickerButtonPointerDown(event, 'style')}
			>
				<span aria-hidden="true" class="style-menu-button__label">
					<span class="style-menu-icon">Aa</span>
					<span>Stil</span>
				</span>
			</button>

			{#if openPicker === 'style'}
				<div
					class="style-menu-popover"
					class:style-menu-popover--above={toolbarPlacement.vertical === 'top'}
					class:style-menu-popover--right={toolbarPlacement.horizontal === 'right'}
					role="dialog"
					tabindex="-1"
					aria-label="Stilinställningar för rubriken"
					onpointerdown={(event) => event.stopPropagation()}
				>
					<section class="style-menu-section">
						<p class="picker-label">Bakgrund</p>
						<div class="palette-grid">
							<button
								class="palette-swatch palette-swatch--transparent"
								class:selected={background === 'none'}
								type="button"
								aria-label="Ingen bakgrund"
								title="Ingen"
								onclick={() => handleBackgroundPaletteSelect({ color: null })}
							>
								<span class="palette-swatch__inner palette-swatch__inner--transparent"></span>
							</button>
							{#each backgroundPaletteColors as swatch}
								<button
									class="palette-swatch"
									class:selected={swatch.value === selectedBackgroundSwatch}
									style={`--swatch-color:${swatch.value};`}
									type="button"
									aria-label={swatch.name}
									title={swatch.name}
									onclick={() => handleBackgroundPaletteSelect({ color: swatch.value })}
								>
									<span class="palette-swatch__inner"></span>
								</button>
							{/each}
						</div>
					</section>

					<section class="style-menu-section">
						<p class="picker-label">Textfärg</p>
						<div class="palette-grid">
							{#each colorPaletteColors as swatch}
								<button
									class="palette-swatch"
									class:selected={swatch.value === selectedColorSwatch}
									style={`--swatch-color:${swatch.value};`}
									type="button"
									aria-label={swatch.name}
									title={swatch.name}
									onclick={() => handleColorPaletteSelect({ color: swatch.value })}
								>
									<span class="palette-swatch__inner"></span>
								</button>
							{/each}
						</div>
					</section>

					<section class="style-menu-section">
						<p class="picker-label">Typsnitt</p>
						<button
							class:alt-font={font === 'display'}
							class="font-choice-button"
							type="button"
							aria-label={`Byt typsnitt för textwidgeten. Nuvarande stil är ${currentFontLabel}.`}
							title={currentFontLabel}
							onclick={onToggleFont}
						>
							<span class="font-icon">Tt</span>
							<span>{currentFontLabel}</span>
						</button>
					</section>
				</div>
			{/if}
		</div>
	{/snippet}
</IntrinsicTextWidgetBase>

<style>
	.picker-control {
		position: relative;
		display: inline-flex;
	}

	.style-menu-button {
		width: auto;
		min-width: 3.2rem;
		padding: 0 0.5rem;
	}

	.style-menu-button__label {
		display: inline-flex;
		align-items: center;
		gap: 0.28rem;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.style-menu-icon {
		font-family: var(--font-display);
		font-size: 0.82rem;
		letter-spacing: -0.05em;
		line-height: 1;
	}

	.style-menu-popover {
		position: absolute;
		left: 0;
		z-index: 10;
		top: calc(100% + 0.55rem);
		width: max-content;
		min-width: 10.5rem;
		max-width: calc(100vw - 2rem);
		padding: 0.7rem;
		border: 1px solid color-mix(in srgb, var(--text) 10%, var(--border));
		border-radius: 0.75rem;
		background: color-mix(in srgb, var(--surface) 92%, var(--surface-soft));
		box-shadow:
			0 10px 30px color-mix(in srgb, black 22%, transparent),
			var(--shadow);
		backdrop-filter: blur(10px);
	}

	.style-menu-popover--above {
		top: auto;
		bottom: calc(100% + 0.55rem);
	}

	.style-menu-popover--right {
		left: auto;
		right: 0;
	}

	.style-menu-section + .style-menu-section {
		margin-top: 0.75rem;
	}

	.picker-label {
		margin: 0 0 0.5rem;
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.palette-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(1.15rem, 1fr));
		align-items: center;
		gap: 0.42rem;
	}

	.palette-swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 96%, white 4%);
		cursor: pointer;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, white 16%, transparent);
	}

	.palette-swatch:hover {
		border-color: color-mix(in srgb, var(--text) 24%, transparent);
	}

	.palette-swatch:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--brand-primary-500) 55%, transparent);
		outline-offset: 2px;
	}

	.palette-swatch.selected {
		outline: 2px solid var(--brand-primary-600);
		outline-offset: 2px;
	}

	.palette-swatch--transparent {
		margin-top: 1px;
	}

	.palette-swatch__inner {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		background: var(--swatch-color);
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
	}

	.palette-swatch__inner--transparent {
		background-image:
			linear-gradient(
				135deg,
				transparent calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 28%, transparent) calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 28%, transparent) calc(50% + 0.5px),
				transparent calc(50% + 0.5px)
			);
	}

	.font-icon {
		font-family: var(--font-display);
		font-size: 0.86rem;
		line-height: 1;
	}

	.font-choice-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		width: 100%;
		height: 2rem;
		padding: 0 0.65rem;
		border: 1px solid var(--border);
		border-radius: 0.55rem;
		background: var(--surface-soft);
		color: var(--text);
		cursor: pointer;
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	.font-choice-button:hover {
		background: color-mix(in srgb, var(--text) 8%, var(--surface-soft));
	}

	.font-choice-button.alt-font .font-icon {
		font-family: var(--font-body);
	}

	.toolbar-button.picker-open {
		background: color-mix(in srgb, var(--brand-primary-500) 14%, var(--surface-soft));
		border-color: color-mix(in srgb, var(--brand-primary-500) 28%, var(--border));
		box-shadow:
			inset 0 0 0 1px color-mix(in srgb, white 10%, transparent),
			0 0 0 1px color-mix(in srgb, var(--brand-primary-500) 30%, transparent);
	}

</style>
