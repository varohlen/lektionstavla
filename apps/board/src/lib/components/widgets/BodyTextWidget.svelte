<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor, type JSONContent } from '@tiptap/core';
	import { FontFamily } from '@tiptap/extension-text-style/font-family';
	import StarterKit from '@tiptap/starter-kit';
	import TaskItem from '@tiptap/extension-task-item';
	import TaskList from '@tiptap/extension-task-list';
	import { TextStyle } from '@tiptap/extension-text-style';
	import FontSize from '@tiptap/extension-font-size';
	import {
		TEXT_WIDGET_BACKGROUND_VARIANTS,
		TEXT_WIDGET_COLOR_VARIANTS,
		type BodyTextFontVariant,
		type TextWidgetBackgroundVariant,
		type TextWidgetColorVariant
	} from '$lib/theme';
	import WidgetShell from './WidgetShell.svelte';

	type Props = {
		x: number;
		y: number;
		w: number;
		h: number;
		z: number;
		selected: boolean;
		resizing: boolean;
		isDark: boolean;
		value: string;
		font: BodyTextFontVariant;
		background: TextWidgetBackgroundVariant;
		color: TextWidgetColorVariant;
		fontLabels: Record<BodyTextFontVariant, string>;
		fontFamilies: Record<BodyTextFontVariant, string>;
		backgroundLabels: Record<TextWidgetBackgroundVariant, string>;
		colorLabels: Record<TextWidgetColorVariant, string>;
		onSelect: () => void;
		onMoveStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onBringForward: () => void;
		onSendBackward: () => void;
		onDelete?: () => void;
		onValueChange: (value: string) => void;
		onBackgroundSelect: (background: TextWidgetBackgroundVariant) => void;
		onColorSelect: (color: TextWidgetColorVariant) => void;
	};

	let {
		x,
		y,
		w,
		h,
		z,
		selected,
		resizing,
		isDark,
		value,
		font,
		background,
		color,
		fontLabels,
		fontFamilies,
		backgroundLabels,
		colorLabels,
		onSelect,
		onMoveStart,
		onResizeStart,
		onBringForward,
		onSendBackward,
		onDelete,
		onValueChange,
		onBackgroundSelect,
		onColorSelect
	}: Props = $props();

	let editorElement = $state<HTMLDivElement | null>(null);
	let editor = $state<Editor | null>(null);
	let isBold = $state(false);
	let isItalic = $state(false);
	let isBulletList = $state(false);
	let isOrderedList = $state(false);
	let isTaskList = $state(false);
	let currentFontSize = $state('16px');
	let currentBlockStyle = $state<'paragraph' | 'h2' | 'h3'>('paragraph');
	let currentPreset = $state('');
	let currentFont = $state<BodyTextFontVariant>('sans');
	let openPicker = $state<'color' | 'background' | null>(null);
	let colorPickerElement = $state<HTMLDivElement | null>(null);
	let backgroundPickerElement = $state<HTMLDivElement | null>(null);
	let activePaletteElement = $state<HTMLDivElement | null>(null);
	const resolvedColorCache = new Map<string, string>();

	const fontSizes = ['12px', '14px', '16px', '20px', '24px', '32px'];
	const fontOptions = $derived(
		(Object.keys(fontLabels) as BodyTextFontVariant[]).map((value) => ({
			value,
			label: fontLabels[value]
		}))
	);
	const colorPaletteColors = $derived(
		TEXT_WIDGET_COLOR_VARIANTS.map((variant) => ({
			variant,
			label: colorLabels[variant],
			value: resolveCssColor(getTextColorValue(variant), 'color')
		}))
	);
	const backgroundPaletteColors = $derived(
		TEXT_WIDGET_BACKGROUND_VARIANTS.map((variant) => ({
			variant,
			label: backgroundLabels[variant],
			value: resolveCssColor(getTextBackgroundValue(variant), 'backgroundColor')
		}))
	);
	const selectedTextColorSwatch = $derived(
		resolveCssColor(getTextColorValue(color), 'color')
	);
	const selectedTextBackgroundSwatch = $derived(
		background === 'none'
			? null
			: resolveCssColor(getTextBackgroundValue(background), 'backgroundColor')
	);
	const bodyTextBackground = $derived(getTextBackgroundValue(background));
	const bodyTextColor = $derived(getTextColorValue(color));
	const bodyTextBorderColor = $derived(
		background === 'none'
			? 'color-mix(in srgb, var(--text) 6%, transparent)'
			: 'color-mix(in srgb, var(--text) 10%, var(--brand-primary-500) 26%)'
	);
	const blockStyleOptions = [
		{ value: 'paragraph', label: 'Brödtext' },
		{ value: 'h2', label: 'Rubrik' },
		{ value: 'h3', label: 'Underrubrik' }
	] as const;
	const blockStylePresets: Record<typeof currentBlockStyle, { fontSize: string; bold: boolean }> = {
		paragraph: { fontSize: '16px', bold: false },
		h2: { fontSize: '24px', bold: true },
		h3: { fontSize: '20px', bold: true }
	};
	const presetOptions = [
		{ value: 'agenda', label: 'Agenda' },
		{ value: 'checklist', label: 'Checklista' },
		{ value: 'instruction', label: 'Instruktion' }
	] as const;
	const presetContent: Record<(typeof presetOptions)[number]['value'], JSONContent> = {
		agenda: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: 'Agenda' }]
				},
				{
					type: 'bulletList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Startuppgift' }] }]
						},
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Genomgång' }] }]
						},
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Eget arbete' }] }]
						}
					]
				}
			]
		},
		checklist: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: 'Checklista' }]
				},
				{
					type: 'taskList',
					content: [
						{
							type: 'taskItem',
							attrs: { checked: false },
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Öppna rätt material' }] }]
						},
						{
							type: 'taskItem',
							attrs: { checked: false },
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Svara på frågorna' }] }]
						},
						{
							type: 'taskItem',
							attrs: { checked: false },
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lämna in innan du går' }] }]
						}
					]
				}
			]
		},
		instruction: {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 2 },
					content: [{ type: 'text', text: 'Instruktion' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Gör så här under lektionen:' }]
				},
				{
					type: 'orderedList',
					content: [
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Läs uppgiften noggrant' }] }]
						},
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Arbeta enskilt eller i par' }] }]
						},
						{
							type: 'listItem',
							content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Be om hjälp om du fastnar' }] }]
						}
					]
				}
			]
		}
	};

	onMount(() => {
		if (!editorElement) return;

		editor = new Editor({
			element: editorElement,
			extensions: [
				StarterKit.configure({
					gapcursor: false,
					heading: {
						levels: [2, 3]
					}
				}),
				TaskList,
				TaskItem.configure({
					nested: false
				}),
				TextStyle,
				FontFamily,
				FontSize
			],
			editorProps: {
				attributes: {
					class: 'body-text-editor tiptap',
					lang: 'sv-SE',
					spellcheck: 'false',
					autocorrect: 'off',
					autocapitalize: 'off',
					autocomplete: 'off'
				}
			},
			content: value || '',
			onUpdate: ({ editor: ed }) => {
				onValueChange(ed.getHTML());
			},
			onSelectionUpdate: ({ editor: ed }) => {
				updateToolbarState(ed);
			},
			onTransaction: ({ editor: ed }) => {
				updateToolbarState(ed);
			}
		});

		updateToolbarState(editor);
	});

	function updateToolbarState(ed: Editor) {
		isBold = ed.isActive('bold');
		isItalic = ed.isActive('italic');
		isBulletList = ed.isActive('bulletList');
		isOrderedList = ed.isActive('orderedList');
		isTaskList = ed.isActive('taskList');
		currentBlockStyle = ed.isActive('heading', { level: 2 })
			? 'h2'
			: ed.isActive('heading', { level: 3 })
				? 'h3'
				: 'paragraph';
		const size = ed.getAttributes('textStyle')?.fontSize;
		currentFontSize = size || blockStylePresets[currentBlockStyle].fontSize;
		const fontFamily = ed.getAttributes('textStyle')?.fontFamily as string | undefined;
		const explicitFont =
			(Object.entries(fontFamilies).find(([, family]) => family === fontFamily)?.[0] as
				| BodyTextFontVariant
				| undefined);
		currentFont = explicitFont ?? (currentBlockStyle === 'paragraph' ? font : 'display');
	}

	onDestroy(() => {
		editor?.destroy();
	});

	$effect(() => {
		if (!editor) return;
		if (editor.isFocused) return;
		const current = editor.getHTML();
		if (current !== value) {
			editor.commands.setContent(value || '', { emitUpdate: false });
		}
	});

	$effect(() => {
		if (!editorElement) return;
		editorElement.style.setProperty('--body-text-default-font', fontFamilies[font]);
	});

	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleTaskList() {
		editor?.chain().focus().toggleTaskList().run();
	}

	function setBlockStyle(event: Event) {
		const style = (event.target as HTMLSelectElement).value as typeof currentBlockStyle;
		const preset = blockStylePresets[style];
		let changed = false;

		if (style === 'paragraph') {
			const chain = editor?.chain().focus().setParagraph().setFontSize(preset.fontSize);
			if (preset.bold) {
				changed = Boolean(chain?.setMark('bold').run());
			} else {
				changed = Boolean(chain?.unsetBold().run());
			}
			if (changed && editor) updateToolbarState(editor);
			return;
		}

		const level = style === 'h2' ? 2 : 3;
		changed = Boolean(
			editor?.chain().focus().setHeading({ level }).setFontSize(preset.fontSize).setMark('bold').run()
		);
		if (changed && editor) updateToolbarState(editor);
	}

	function setFontSize(event: Event) {
		const size = (event.target as HTMLSelectElement).value;
		if (size === '16px') {
			editor?.chain().focus().unsetFontSize().run();
		} else {
			editor?.chain().focus().setFontSize(size).run();
		}
	}

	function setFontFamily(event: Event) {
		const nextFont = (event.target as HTMLSelectElement).value as BodyTextFontVariant;
		if (!editor || !fontFamilies[nextFont]) return;

		if (nextFont === font) {
			editor.chain().focus().unsetFontFamily().run();
		} else {
			editor.chain().focus().setFontFamily(fontFamilies[nextFont]).run();
		}

		updateToolbarState(editor);
	}

	function getTextBackgroundValue(variant: TextWidgetBackgroundVariant) {
		switch (variant) {
			case 'surface':
				return 'var(--body-text-bg-surface)';
			case 'primary':
				return 'var(--body-text-bg-primary)';
			case 'warm':
				return 'var(--body-text-bg-warm)';
			case 'success':
				return 'var(--body-text-bg-success)';
			case 'danger':
				return 'var(--body-text-bg-danger)';
			case 'none':
			default:
				return 'var(--body-text-bg-subtle)';
		}
	}

	function getTextColorValue(variant: TextWidgetColorVariant) {
		if (variant === 'default') {
			return 'var(--body-text-color-default)';
		}

		switch (variant) {
			case 'inverse':
				return 'var(--body-text-color-inverse)';
			case 'primary':
				return 'var(--body-text-color-primary)';
			case 'warm':
				return 'var(--body-text-color-warm)';
			case 'success':
				return 'var(--body-text-color-success)';
			case 'danger':
				return 'var(--body-text-color-danger)';
			default:
				return 'var(--body-text-color-default)';
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

	$effect(() => {
		if (!activePaletteElement) return;
		const rect = activePaletteElement.getBoundingClientRect();
		const edgePadding = 12;
		if (rect.right > window.innerWidth - edgePadding) {
			const overflow = rect.right - window.innerWidth + edgePadding;
			activePaletteElement.style.transform = `translateX(${-overflow}px)`;
		} else if (rect.left < edgePadding) {
			const overflow = edgePadding - rect.left;
			activePaletteElement.style.transform = `translateX(${overflow}px)`;
		} else {
			activePaletteElement.style.transform = '';
		}
	});

	function togglePicker(kind: 'color' | 'background') {
		openPicker = openPicker === kind ? null : kind;
	}

	function handlePickerButtonPointerDown(event: PointerEvent, kind: 'color' | 'background') {
		event.preventDefault();
		event.stopPropagation();
		togglePicker(kind);
	}

	function closePicker() {
		openPicker = null;
		activePaletteElement = null;
	}

	function handleDocumentPointerDown(event: PointerEvent) {
		if (!openPicker) return;
		const target = event.target;
		if (!(target instanceof Node)) return;

		if (colorPickerElement?.contains(target) || backgroundPickerElement?.contains(target)) {
			return;
		}

		closePicker();
	}

	function setTextColor(variant: TextWidgetColorVariant) {
		onColorSelect(variant);
		closePicker();
	}

	function setTextBackground(variant: TextWidgetBackgroundVariant) {
		onBackgroundSelect(variant);
		closePicker();
	}

	function applyPreset(event: Event) {
		const preset = (event.target as HTMLSelectElement).value as keyof typeof presetContent | '';
		currentPreset = '';
		if (!editor || !preset) return;

		const hasContent = editor.getText().trim().length > 0;
		if (hasContent && !window.confirm('Ersätta nuvarande innehåll med mallen?')) {
			return;
		}

		editor.commands.setContent(presetContent[preset]);
		editor.commands.focus('end');
	}
</script>

<svelte:document onpointerdown={handleDocumentPointerDown} />

<WidgetShell
	title="Brödtext"
	{x}
	{y}
	{w}
	{h}
	{z}
	{selected}
	chrome={true}
	allowBodyOverflow={true}
	background={bodyTextBackground}
	color={bodyTextColor}
	borderColor={bodyTextBorderColor}
	{onSelect}
	{onMoveStart}
	{onResizeStart}
	{onBringForward}
	{onSendBackward}
	{onDelete}
>
	<div class="body-text-container">
		{#if selected && !resizing && editor}
			<div class="formatting-toolbar">
				<select
					class="fmt-select fmt-select-block"
					value={currentBlockStyle}
					onchange={setBlockStyle}
					title="Texttyp"
				>
					{#each blockStyleOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				<select
					class="fmt-select fmt-select-font"
					value={currentFont}
					onchange={setFontFamily}
					title="Typsnitt"
				>
					{#each fontOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				<button
					class="fmt-btn"
					class:active={isBold}
					onclick={toggleBold}
					title="Fetstil (Cmd+B)"
				>
					<strong>B</strong>
				</button>
				<button
					class="fmt-btn"
					class:active={isItalic}
					onclick={toggleItalic}
					title="Kursiv (Cmd+I)"
				>
					<em>I</em>
				</button>
				<span class="fmt-divider"></span>
				<div bind:this={colorPickerElement} class="fmt-picker-control">
					<button
						class="fmt-btn fmt-style-btn"
						class:active={color !== 'default'}
						class:picker-open={openPicker === 'color'}
						style={`--fmt-preview-color:${getTextColorValue(color)};`}
						type="button"
						title={`Textfärg: ${colorLabels[color]}`}
						aria-expanded={openPicker === 'color'}
						aria-label={`Välj textfärg. Nuvarande färg är ${colorLabels[color]}.`}
						onpointerdown={(event) => handlePickerButtonPointerDown(event, 'color')}
					>
						<span class="fmt-color-icon" aria-hidden="true">A</span>
					</button>

					{#if openPicker === 'color'}
						<div
							bind:this={activePaletteElement}
							class="fmt-palette"
							role="dialog"
							tabindex="-1"
							aria-label="Välj textfärg"
							onpointerdown={(event) => event.stopPropagation()}
						>
							<p class="fmt-palette-label">Textfärg</p>
							<div class="fmt-palette-grid">
								{#each colorPaletteColors as swatch}
									<button
										class="fmt-palette-swatch"
										class:selected={swatch.value === selectedTextColorSwatch}
										style={`--swatch-color:${swatch.value};`}
										type="button"
										aria-label={swatch.label}
										title={swatch.label}
										onpointerdown={(event) => event.preventDefault()}
										onclick={() => setTextColor(swatch.variant)}
									>
										<span class="fmt-palette-swatch__inner"></span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<div bind:this={backgroundPickerElement} class="fmt-picker-control">
					<button
						class="fmt-btn fmt-style-btn"
						class:active={background !== 'none'}
						class:picker-open={openPicker === 'background'}
						style={`--fmt-preview-fill:${getTextBackgroundValue(background)};`}
						type="button"
						title={`Bakgrund: ${backgroundLabels[background]}`}
						aria-expanded={openPicker === 'background'}
						aria-label={`Välj bakgrundsfärg. Nuvarande bakgrund är ${backgroundLabels[background]}.`}
						onpointerdown={(event) => handlePickerButtonPointerDown(event, 'background')}
					>
						<span
							class="fmt-background-icon"
							class:is-transparent={background === 'none'}
							aria-hidden="true"
						></span>
					</button>

					{#if openPicker === 'background'}
						<div
							bind:this={activePaletteElement}
							class="fmt-palette"
							role="dialog"
							tabindex="-1"
							aria-label="Välj bakgrundsfärg"
							onpointerdown={(event) => event.stopPropagation()}
						>
							<p class="fmt-palette-label">Bakgrund</p>
							<div class="fmt-palette-grid">
								{#each backgroundPaletteColors as swatch}
									<button
										class="fmt-palette-swatch"
										class:selected={swatch.variant === 'none'
											? background === 'none'
											: swatch.value === selectedTextBackgroundSwatch}
										class:transparent={swatch.variant === 'none'}
										style={`--swatch-color:${swatch.value};`}
										type="button"
										aria-label={swatch.label}
										title={swatch.label}
										onpointerdown={(event) => event.preventDefault()}
										onclick={() => setTextBackground(swatch.variant)}
									>
										<span class="fmt-palette-swatch__inner"></span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<span class="fmt-divider"></span>
				<button
					class="fmt-btn"
					class:active={isBulletList}
					onclick={toggleBulletList}
					title="Punktlista"
				>
					<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
						<circle cx="2.5" cy="3.5" r="1.5"/>
						<circle cx="2.5" cy="8" r="1.5"/>
						<circle cx="2.5" cy="12.5" r="1.5"/>
						<rect x="6" y="2.5" width="9" height="2" rx="0.5"/>
						<rect x="6" y="7" width="9" height="2" rx="0.5"/>
						<rect x="6" y="11.5" width="9" height="2" rx="0.5"/>
					</svg>
				</button>
				<button
					class="fmt-btn"
					class:active={isOrderedList}
					onclick={toggleOrderedList}
					title="Numrerad lista"
				>
					<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
						<text x="0.5" y="5" font-size="5" font-weight="600">1.</text>
						<text x="0.5" y="9.5" font-size="5" font-weight="600">2.</text>
						<text x="0.5" y="14" font-size="5" font-weight="600">3.</text>
						<rect x="6" y="2.5" width="9" height="2" rx="0.5"/>
						<rect x="6" y="7" width="9" height="2" rx="0.5"/>
						<rect x="6" y="11.5" width="9" height="2" rx="0.5"/>
					</svg>
				</button>
				<button
					class="fmt-btn"
					class:active={isTaskList}
					onclick={toggleTaskList}
					title="Checklista"
				>
					<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
						<rect x="1.5" y="2.25" width="3" height="3" rx="0.6"/>
						<rect x="1.5" y="10.75" width="3" height="3" rx="0.6"/>
						<path d="M2.3 6.95l1.1 1.1 1.8-2.1"/>
						<path d="M6.8 4h7.2"/>
						<path d="M6.8 12.5h7.2"/>
					</svg>
				</button>
				<span class="fmt-divider"></span>
				<select
					class="fmt-select"
					value={currentFontSize}
					onchange={setFontSize}
					title="Textstorlek"
				>
					{#each fontSizes as size}
						<option value={size}>{parseInt(size)}px</option>
					{/each}
				</select>
				<select
					class="fmt-select fmt-select-preset"
					value={currentPreset}
					onchange={applyPreset}
					title="Infoga mall"
				>
					<option value="">Mall…</option>
					{#each presetOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
		{/if}
		<div class="body-text-wrap">
			<div
				bind:this={editorElement}
			>
			</div>
		</div>
	</div>
</WidgetShell>

<style>
	.body-text-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.formatting-toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.2rem;
		padding: 0.25rem 0.35rem;
		border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		flex-shrink: 0;
	}

	.fmt-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.65rem;
		height: 1.65rem;
		border: none;
		border-radius: 0.3rem;
		background: transparent;
		color: inherit;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background 0.12s;
	}

	.fmt-btn:hover {
		background: color-mix(in srgb, var(--text) 10%, transparent);
	}

	.fmt-btn.active {
		background: color-mix(in srgb, var(--brand-primary-700) 20%, transparent);
		color: var(--brand-primary-700);
	}

	.fmt-btn.picker-open {
		background: color-mix(in srgb, var(--brand-primary-500) 16%, var(--surface-soft));
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-primary-500) 40%, transparent);
	}

	.fmt-style-btn {
		width: auto;
		min-width: 1.9rem;
		border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
		background: color-mix(in srgb, var(--surface) 94%, var(--surface-soft));
	}

	.fmt-picker-control {
		position: relative;
		display: inline-flex;
	}

	.fmt-color-icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		color: var(--fmt-preview-color);
		font-size: 0.9rem;
		font-weight: 900;
		line-height: 1;
		text-shadow: 0 1px 0 color-mix(in srgb, var(--surface) 70%, transparent);
	}

	.fmt-color-icon::after {
		content: '';
		position: absolute;
		right: 0.08rem;
		bottom: -0.08rem;
		left: 0.08rem;
		height: 0.13rem;
		border-radius: 999px;
		background: currentColor;
	}

	.fmt-background-icon {
		width: 1rem;
		height: 1rem;
		border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
		border-radius: 0.25rem;
		background: var(--fmt-preview-fill);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
	}

	.fmt-background-icon.is-transparent {
		background:
			linear-gradient(
				135deg,
				transparent calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 32%, transparent) calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 32%, transparent) calc(50% + 0.5px),
				transparent calc(50% + 0.5px)
			),
			color-mix(in srgb, var(--surface) 90%, white 10%);
	}

	.fmt-palette {
		position: absolute;
		top: calc(100% + 0.42rem);
		left: 0;
		z-index: 20;
		min-width: 8.8rem;
		padding: 0.6rem 0.65rem 0.7rem;
		border: 1px solid color-mix(in srgb, var(--text) 12%, var(--border));
		border-radius: 0.7rem;
		background: color-mix(in srgb, var(--surface) 94%, var(--surface-soft));
		box-shadow:
			0 12px 28px color-mix(in srgb, black 20%, transparent),
			var(--shadow);
		backdrop-filter: blur(10px);
	}

	.fmt-palette-label {
		margin: 0 0 0.48rem;
		color: var(--muted);
		font-size: 0.62rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.fmt-palette-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(1.25rem, 1fr));
		gap: 0.42rem;
	}

	.fmt-palette-swatch {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 96%, white 4%);
		cursor: pointer;
		box-shadow: inset 0 0 0 1px color-mix(in srgb, white 16%, transparent);
	}

	.fmt-palette-swatch:hover {
		border-color: color-mix(in srgb, var(--text) 26%, transparent);
	}

	.fmt-palette-swatch:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--brand-primary-500) 55%, transparent);
		outline-offset: 2px;
	}

	.fmt-palette-swatch.selected {
		outline: 2px solid var(--brand-primary-600);
		outline-offset: 2px;
	}

	.fmt-palette-swatch__inner {
		width: 0.76rem;
		height: 0.76rem;
		border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
		border-radius: 999px;
		background: var(--swatch-color);
	}

	.fmt-palette-swatch.transparent .fmt-palette-swatch__inner {
		background:
			linear-gradient(
				135deg,
				transparent calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 32%, transparent) calc(50% - 0.5px),
				color-mix(in srgb, var(--text) 32%, transparent) calc(50% + 0.5px),
				transparent calc(50% + 0.5px)
			),
			color-mix(in srgb, var(--surface) 90%, white 10%);
	}

	.fmt-divider {
		width: 1px;
		height: 1.1rem;
		background: color-mix(in srgb, var(--text) 15%, transparent);
		margin: 0 0.15rem;
	}

	.fmt-select {
		height: 1.65rem;
		border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
		border-radius: 0.3rem;
		background: transparent;
		color: inherit;
		font-size: 0.7rem;
		padding: 0 0.3rem;
		cursor: pointer;
	}

	.fmt-select-block {
		min-width: 6.5rem;
	}

	.fmt-select-font {
		min-width: 10.8rem;
	}

	.fmt-select-preset {
		min-width: 5.5rem;
	}

	.body-text-wrap {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	:global(.screen-shell[data-theme='light']) {
		--body-text-color-default: var(--text);
		--body-text-color-inverse: white;
		--body-text-color-primary: var(--brand-primary-700);
		--body-text-color-warm: var(--brand-warm-700);
		--body-text-color-success: var(--brand-success-700);
		--body-text-color-danger: var(--brand-danger-700);
		--body-text-bg-subtle: color-mix(in srgb, var(--surface) 72%, var(--bg-bottom) 28%);
		--body-text-bg-surface: color-mix(in srgb, var(--surface) 92%, white 8%);
		--body-text-bg-primary: var(--brand-primary-600);
		--body-text-bg-warm: var(--brand-warm-600);
		--body-text-bg-success: var(--brand-success-600);
		--body-text-bg-danger: var(--brand-danger-600);
	}

	:global(.screen-shell[data-theme='dark']) {
		--body-text-color-default: var(--text);
		--body-text-color-inverse: var(--brand-primary-900);
		--body-text-color-primary: var(--brand-primary-300);
		--body-text-color-warm: var(--brand-warm-300);
		--body-text-color-success: var(--brand-success-300);
		--body-text-color-danger: var(--brand-danger-300);
		--body-text-bg-subtle: color-mix(in srgb, var(--surface) 60%, var(--bg-bottom) 40%);
		--body-text-bg-surface: color-mix(in srgb, var(--surface) 78%, white 22%);
		--body-text-bg-primary: color-mix(in srgb, var(--surface) 82%, var(--brand-primary-500) 18%);
		--body-text-bg-warm: color-mix(in srgb, var(--brand-warm-500) 74%, var(--surface));
		--body-text-bg-success: color-mix(in srgb, var(--brand-success-500) 76%, var(--surface));
		--body-text-bg-danger: color-mix(in srgb, var(--brand-danger-500) 74%, var(--surface));
	}

	:global(.body-text-editor.tiptap) {
		width: 100%;
		min-height: 100%;
		box-sizing: border-box;
		padding: 0.35rem 0.4rem;
		outline: none;
		font-family: var(--body-text-default-font, var(--font-body));
		font-size: 1rem;
		font-weight: 400;
		line-height: 1.55;
		color: inherit;
		min-height: 100%;
		user-select: text;
		cursor: text;
	}

	:global(.body-text-editor.tiptap p.is-editor-empty:first-child::before) {
		content: "Skriv instruktioner här...";
		color: color-mix(in srgb, currentColor 38%, transparent);
		pointer-events: none;
		float: left;
		height: 0;
	}

	:global(.body-text-editor.tiptap p) {
		margin: 0 0 0.3rem;
	}

	:global(.body-text-editor.tiptap h2),
	:global(.body-text-editor.tiptap h3) {
		margin: 0.1rem 0 0.45rem;
		line-height: 1.2;
		font-family: var(--font-display, var(--body-text-default-font, var(--font-body)));
	}

	:global(.body-text-editor.tiptap h2) {
		font-size: 1.35rem;
		font-weight: 700;
	}

	:global(.body-text-editor.tiptap h3) {
		font-size: 1.1rem;
		font-weight: 700;
	}

	:global(.body-text-editor.tiptap ul),
	:global(.body-text-editor.tiptap ol) {
		margin: 0.3rem 0;
		padding-left: 1.4rem;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"]) {
		list-style: none !important;
		margin: 0.45rem 0 0.15rem;
		padding-left: 0 !important;
		padding-inline-start: 0 !important;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li) {
		display: grid !important;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: baseline;
		column-gap: 0.7rem;
		margin-bottom: 0.5rem;
		list-style: none !important;
		padding-left: 0 !important;
		padding-inline-start: 0 !important;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li::marker) {
		content: '' !important;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li > label) {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0.16rem 0 0;
		padding: 0;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li > label > span) {
		display: none;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li input[type="checkbox"]) {
		display: block;
		width: 1.05rem;
		height: 1.05rem;
		margin: 0;
		accent-color: currentColor;
		cursor: pointer;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li > div) {
		min-width: 0;
	}

	:global(.body-text-editor.tiptap ul[data-type="taskList"] > li > div > p) {
		margin: 0;
		line-height: 1.4;
	}

	:global(.body-text-editor.tiptap li) {
		margin-bottom: 0.15rem;
	}

	:global(.body-text-editor.tiptap strong) {
		font-weight: 700;
	}

	:global(.body-text-editor.tiptap em) {
		font-style: italic;
	}
</style>
