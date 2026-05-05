<script lang="ts">
	import { fly } from "svelte/transition";

	type Entry = {
		key: string;
		label: string;
		count: number;
		status: "ready" | "beta" | "prototype";
		note?: string;
		onAdd: () => void;
	};

	type Props = {
		open: boolean;
		entries: Entry[];
	};

	let { open, entries }: Props = $props();
	let experimentalOpen = $state(false);

	const categoryMap: Record<string, string> = {
		digital: "Tid",
		lcd: "Tid",
		analog: "Tid",
		date: "Tid",
		timer: "Timer",
		lessonTimer: "Timer",
		stopwatch: "Timer",
		text: "Text",
		bodyText: "Text",
		qrcode: "Övrigt",
		trelson: "Övrigt",
		logo: "Övrigt",
	};

	const categoryOrder = ["Tid", "Timer", "Text", "Övrigt"];

	const categoryColors: Record<string, string> = {
		"Tid": "var(--brand-primary-500)",
		"Timer": "var(--brand-warm-500, #e67e22)",
		"Text": "var(--brand-primary-700, #2d6a4f)",
		"Övrigt": "var(--muted)",
	};

	type Category = { name: string; entries: Entry[] };

	const readyEntries = $derived(
		entries.filter((e) => e.status !== "prototype"),
	);
	const prototypeEntries = $derived(
		entries.filter((e) => e.status === "prototype"),
	);

	const categories = $derived<Category[]>(
		categoryOrder
			.map((name) => ({
				name,
				entries: readyEntries.filter((e) => categoryMap[e.key] === name),
			}))
			.filter((c) => c.entries.length > 0),
	);
</script>

{#snippet widgetIcon(key: string)}
	{#if key === "digital"}
		<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M9 10v4M12 10v4M15 10v4" /><circle cx="10.5" cy="12" r="0.5" fill="currentColor" /></svg>
	{:else if key === "lcd"}
		<svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M7 10h2v1.5H7zM7 12.5h2V14H7zM11 10h2v1.5h-2zM11 12.5h2V14h-2zM15 10h2v4" /></svg>
	{:else if key === "analog"}
		<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
	{:else if key === "date"}
		<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" /></svg>
	{:else if key === "timer"}
		<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M10 2h4" /></svg>
	{:else if key === "lessonTimer"}
		<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 12V7" /><path d="M12 3a9 9 0 0 1 6.36 2.64" stroke-dasharray="2 2" /></svg>
	{:else if key === "stopwatch"}
		<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8" /><path d="M12 9v4M10 2h4M19.4 7l1.4-1.4" /></svg>
	{:else if key === "text"}
		<svg viewBox="0 0 24 24"><path d="M6 4h12M12 4v16M8 20h8" /></svg>
	{:else if key === "bodyText"}
		<svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h10M4 18h12" /></svg>
	{:else if key === "qrcode"}
		<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="4" height="4" rx="0.5" /><path d="M21 14h-3v3M21 21h-3v-1M18 21h-1" /></svg>
	{:else if key === "trelson"}
		<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="9" cy="10" r="1.2" fill="currentColor" /><circle cx="15" cy="10" r="1.2" fill="currentColor" /><circle cx="9" cy="15" r="1.2" fill="currentColor" /><circle cx="15" cy="15" r="1.2" fill="currentColor" /></svg>
	{:else if key === "logo"}
		<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 12h8M12 9v6" /></svg>
	{:else}
		<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
	{/if}
{/snippet}

{#if open}
	<div class="panel" transition:fly={{ y: 8, duration: 150 }}>
		<div class="panel-header">
			<p class="panel-title">Widgets</p>
		</div>

		<div class="category-grid">
			{#each categories as category}
				<div class="category" style:--cat-color={categoryColors[category.name]}>
					<p class="category-label">
						<span class="category-dot"></span>
						{category.name}
					</p>
					<div class="entry-list">
						{#each category.entries as entry}
							<button class="entry-card" type="button" onclick={entry.onAdd} aria-label={`Lägg till ${entry.label}`}>
								<span class="entry-icon">
									{@render widgetIcon(entry.key)}
								</span>
								<span class="entry-body">
									<span class="entry-name">
										{entry.label}
										{#if entry.status === "beta"}
											<span class="entry-badge entry-badge--beta">Beta</span>
										{/if}
									</span>
									{#if entry.note}
										<span class="entry-note">{entry.note}</span>
									{/if}
								</span>
								{#if entry.count > 0}
									<span class="entry-count">{entry.count}</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		{#if prototypeEntries.length > 0}
			<div class="prototype-section">
				<button
					class="section-toggle"
					type="button"
					aria-expanded={experimentalOpen}
					onclick={() => (experimentalOpen = !experimentalOpen)}
				>
					<span>Prototyper</span>
					<span class:section-toggle__chevron--open={experimentalOpen} class="section-toggle__chevron">
						&#8964;
					</span>
				</button>

				{#if experimentalOpen}
					<div class="entry-list entry-list--proto">
						{#each prototypeEntries as entry}
							<button class="entry-card entry-card--proto" type="button" onclick={entry.onAdd} aria-label={`Lägg till ${entry.label}`}>
								<span class="entry-icon">
									{@render widgetIcon(entry.key)}
								</span>
								<span class="entry-body">
									<span class="entry-name">
										{entry.label}
										<span class="entry-badge entry-badge--prototype">Prototyp</span>
									</span>
									{#if entry.note}
										<span class="entry-note">{entry.note}</span>
									{/if}
								</span>
								{#if entry.count > 0}
									<span class="entry-count">{entry.count}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.panel {
		position: fixed;
		bottom: 4.2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 19;
		width: min(40rem, calc(100vw - 2rem));
		max-height: calc(100vh - 6rem);
		overflow-y: auto;
		padding: 1rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: 0.85rem;
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.panel-header {
		margin-bottom: 0.85rem;
	}

	.panel-title {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.category-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.category-label {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0 0 0.45rem;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--cat-color, var(--muted));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.category-dot {
		display: inline-block;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: var(--cat-color, var(--muted));
		opacity: 0.7;
	}

	.entry-list {
		display: grid;
		gap: 0.4rem;
	}

	.entry-list--proto {
		margin-top: 0.5rem;
		grid-template-columns: repeat(2, 1fr);
	}

	.entry-card {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		padding: 0.6rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 0.55rem;
		background: var(--surface-soft);
		color: var(--text);
		font: inherit;
		cursor: pointer;
		transition: background 120ms ease, border-color 120ms ease, transform 80ms ease;
		text-align: left;
	}

	.entry-card:hover {
		background: color-mix(in srgb, var(--cat-color, var(--brand-primary-500)) 7%, var(--surface-soft));
		border-color: color-mix(in srgb, var(--cat-color, var(--brand-primary-500)) 25%, var(--border));
	}

	.entry-card:active {
		transform: scale(0.98);
	}

	.entry-card--proto {
		font-size: 0.84rem;
	}

	.entry-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0.3rem;
		border-radius: 0.4rem;
		background: color-mix(in srgb, var(--cat-color, var(--brand-primary-500)) 10%, transparent);
		color: var(--cat-color, var(--brand-primary-500));
	}

	.entry-icon svg {
		width: 100%;
		height: 100%;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 1.8;
	}

	.entry-body {
		display: flex;
		flex-direction: column;
		gap: 0.12rem;
		min-width: 0;
		flex: 1;
	}

	.entry-name {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.86rem;
		font-weight: 600;
		line-height: 1.2;
	}

	.entry-note {
		font-size: 0.72rem;
		color: var(--muted);
		line-height: 1.35;
	}

	.entry-badge {
		padding: 0.06rem 0.28rem;
		border-radius: 0.25rem;
		font-size: 0.56rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		vertical-align: middle;
		flex-shrink: 0;
	}

	.entry-badge--beta {
		background: color-mix(in srgb, var(--brand-warm-500) 16%, transparent);
		color: var(--brand-warm-700);
	}

	.entry-badge--prototype {
		background: color-mix(in srgb, var(--brand-primary-500) 14%, transparent);
		color: var(--brand-primary-700);
	}

	.entry-count {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.35rem;
		height: 1.35rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 700;
		color: var(--muted);
		background: color-mix(in srgb, var(--text) 8%, transparent);
		flex-shrink: 0;
		align-self: center;
	}

	.prototype-section {
		margin-top: 0.85rem;
		padding-top: 0.65rem;
		border-top: 1px solid var(--border);
	}

	.section-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.15rem 0;
		border: 0;
		background: transparent;
		color: var(--muted);
		font: inherit;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		cursor: pointer;
	}

	.section-toggle__chevron {
		font-size: 1rem;
		line-height: 1;
		transition: transform 140ms ease;
	}

	.section-toggle__chevron--open {
		transform: rotate(180deg);
	}
</style>
