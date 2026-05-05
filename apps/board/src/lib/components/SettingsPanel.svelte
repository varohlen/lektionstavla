<script lang="ts">
    import { fly } from "svelte/transition";

    type Theme = "light" | "dark";
    type LibraryItem = {
        id: string;
        name: string;
        kind: "screen" | "template";
        updatedAt: string;
    };

    type Props = {
        open: boolean;
        theme: Theme;
        showGrid: boolean;
        snapToGrid: boolean;
        libraryItems: LibraryItem[];
        onExportBoard: () => void;
        onImportBoard: (file: File) => void;
        onSaveScreen: () => void;
        onSaveTemplate: () => void;
        onLoadLibraryItem: (id: string) => void;
        onDeleteLibraryItem: (id: string) => void;
        onResetBoard: () => void;
        onToggleTheme: () => void;
        onToggleShowGrid: () => void;
        onToggleSnapToGrid: () => void;
    };

    let {
        open,
        theme,
        showGrid,
        snapToGrid,
        libraryItems,
        onExportBoard,
        onImportBoard,
        onSaveScreen,
        onSaveTemplate,
        onLoadLibraryItem,
        onDeleteLibraryItem,
        onResetBoard,
        onToggleTheme,
        onToggleShowGrid,
        onToggleSnapToGrid,
    }: Props = $props();

    let importInput = $state<HTMLInputElement | null>(null);
    const savedScreens = $derived(
        libraryItems.filter((item) => item.kind === "screen"),
    );
    const savedTemplates = $derived(
        libraryItems.filter((item) => item.kind === "template"),
    );

    function handleImportChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        onImportBoard(file);
        input.value = "";
    }
</script>

{#if open}
    <div class="panel" transition:fly={{ y: 8, duration: 150 }}>
        <p class="panel-title">Tavla</p>

        <div class="section">
            <p class="section-label">Precision</p>
            <div class="toggle-row-group">
                <button class="toggle-row" type="button" onclick={onToggleShowGrid}>
                    <span class="toggle-label">Visa rutnät</span>
                    <span class="toggle-pill" class:active={showGrid}>
                        <span class="toggle-thumb"></span>
                    </span>
                </button>

                <button class="toggle-row" type="button" onclick={onToggleSnapToGrid}>
                    <span class="toggle-label">Snap till rutnät</span>
                    <span class="toggle-pill" class:active={snapToGrid}>
                        <span class="toggle-thumb"></span>
                    </span>
                </button>
            </div>
        </div>

        <div class="section">
            <p class="section-label">Spara & Dela</p>
            <div class="action-grid">
                <button class="action-btn" type="button" onclick={onSaveScreen}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Spara tavla</span>
                </button>

                <button class="action-btn" type="button" onclick={onSaveTemplate}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span>Spara som mall</span>
                </button>

                <button class="action-btn" type="button" onclick={onExportBoard}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Exportera</span>
                </button>

                <button class="action-btn" type="button" onclick={() => importInput?.click()}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Importera</span>
                </button>
            </div>
        </div>

        {#if libraryItems.length > 0}
            <div class="section">
                <p class="section-label">
                    Bibliotek
                    <span class="section-count">{libraryItems.length}</span>
                </p>

                {#if savedScreens.length > 0}
                    <div class="library-group">
                        <p class="library-group-title">Tavlor</p>
                        <div class="library-list">
                            {#each savedScreens as item}
                                <div class="library-item">
                                    <button
                                        class="library-load"
                                        type="button"
                                        onclick={() => onLoadLibraryItem(item.id)}
                                    >
                                        <span class="library-name">{item.name}</span>
                                        <span class="library-date">
                                            {new Date(item.updatedAt).toLocaleDateString("sv-SE")}
                                        </span>
                                    </button>
                                    <button
                                        class="library-delete"
                                        type="button"
                                        aria-label={`Ta bort ${item.name}`}
                                        onclick={() => onDeleteLibraryItem(item.id)}
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if savedTemplates.length > 0}
                    <div class="library-group">
                        <p class="library-group-title">Mallar</p>
                        <div class="library-list">
                            {#each savedTemplates as item}
                                <div class="library-item">
                                    <button
                                        class="library-load"
                                        type="button"
                                        onclick={() => onLoadLibraryItem(item.id)}
                                    >
                                        <span class="library-name">{item.name}</span>
                                        <span class="library-date">
                                            {new Date(item.updatedAt).toLocaleDateString("sv-SE")}
                                        </span>
                                    </button>
                                    <button
                                        class="library-delete"
                                        type="button"
                                        aria-label={`Ta bort ${item.name}`}
                                        onclick={() => onDeleteLibraryItem(item.id)}
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="section">
                <p class="section-label">Bibliotek</p>
                <p class="library-empty">
                    Inga sparade tavlor. Allt lagras lokalt i webbläsaren.
                </p>
            </div>
        {/if}

        <div class="section section--danger">
            <button class="reset-btn" type="button" onclick={onResetBoard}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Rensa tavla</span>
            </button>
        </div>

        <input
            bind:this={importInput}
            class="hidden-file-input"
            type="file"
            accept="application/json,.json"
            onchange={handleImportChange}
        />
    </div>
{/if}

<style>
    .panel {
        position: fixed;
        bottom: 4.2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 19;
        width: min(26rem, calc(100vw - 2rem));
        max-height: calc(100vh - 6rem);
        overflow-y: auto;
        padding: 1rem 1.1rem;
        border: 1px solid var(--border);
        border-radius: 0.85rem;
        background: var(--surface);
        box-shadow: var(--shadow);
    }

    .panel-title {
        margin: 0 0 0.85rem;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .section {
        padding: 0.75rem 0;
        border-top: 1px solid var(--border);
    }

    .section:first-of-type {
        border-top: none;
        padding-top: 0;
    }

    .section--danger {
        padding-bottom: 0;
    }

    .section-label {
        margin: 0 0 0.5rem;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .section-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.2rem;
        height: 1.2rem;
        padding: 0 0.3rem;
        border-radius: 0.25rem;
        font-size: 0.65rem;
        font-weight: 700;
        background: color-mix(in srgb, var(--text) 8%, transparent);
        color: var(--muted);
    }

    .toggle-row-group {
        display: grid;
        gap: 0.4rem;
    }

    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface-soft);
        color: var(--text);
        font: inherit;
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 120ms ease;
    }

    .toggle-row:hover {
        background: color-mix(in srgb, var(--brand-primary-500) 6%, var(--surface-soft));
    }

    .toggle-label {
        line-height: 1;
    }

    .toggle-pill {
        --pill-width: 2.4rem;
        --pill-height: 1.4rem;
        --pill-padding: 0.15rem;
        --thumb-size: 1rem;

        position: relative;
        display: inline-flex;
        align-items: center;
        width: var(--pill-width);
        height: var(--pill-height);
        padding: var(--pill-padding);
        border-radius: 999px;
        background: color-mix(in srgb, var(--text) 12%, transparent);
        transition: background 140ms ease;
    }

    .toggle-pill.active {
        background: color-mix(in srgb, var(--brand-primary-500) 40%, var(--surface-soft));
    }

    .toggle-thumb {
        display: block;
        width: var(--thumb-size);
        height: var(--thumb-size);
        border-radius: 999px;
        background: var(--surface);
        box-shadow: 0 1px 3px color-mix(in srgb, var(--text) 12%, transparent);
        transform: translateX(0);
        transition: transform 140ms ease;
    }

    .toggle-pill.active .toggle-thumb {
        transform: translateX(calc(var(--pill-width) - var(--thumb-size) - var(--pill-padding) * 2));
    }

    .action-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.4rem;
    }

    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface-soft);
        color: var(--text);
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
    }

    .action-btn:hover {
        background: color-mix(in srgb, var(--brand-primary-500) 8%, var(--surface-soft));
        border-color: color-mix(in srgb, var(--brand-primary-500) 22%, var(--border));
    }

    .action-btn:active {
        transform: scale(0.97);
    }

    .action-btn svg {
        width: 0.95rem;
        height: 0.95rem;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
        flex-shrink: 0;
        color: var(--muted);
    }

    .hidden-file-input {
        display: none;
    }

    .library-group {
        margin-bottom: 0.6rem;
    }

    .library-group:last-child {
        margin-bottom: 0;
    }

    .library-group-title {
        margin: 0 0 0.35rem;
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--muted);
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .library-list {
        display: grid;
        gap: 0.35rem;
    }

    .library-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.35rem;
        align-items: stretch;
    }

    .library-load {
        display: grid;
        gap: 0.1rem;
        padding: 0.5rem 0.7rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface-soft);
        color: var(--text);
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
    }

    .library-load:hover {
        background: color-mix(in srgb, var(--brand-primary-500) 8%, var(--surface-soft));
        border-color: color-mix(in srgb, var(--brand-primary-500) 22%, var(--border));
    }

    .library-name {
        font-size: 0.88rem;
        font-weight: 600;
    }

    .library-date {
        font-size: 0.72rem;
        color: var(--muted);
    }

    .library-delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        background: var(--surface-soft);
        color: var(--muted);
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    }

    .library-delete:hover {
        background: color-mix(in srgb, #e53e3e 8%, var(--surface-soft));
        border-color: color-mix(in srgb, #e53e3e 30%, var(--border));
        color: #e53e3e;
    }

    .library-delete svg {
        width: 0.9rem;
        height: 0.9rem;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
    }

    .library-empty {
        margin: 0;
        color: var(--muted);
        font-size: 0.84rem;
        line-height: 1.45;
    }

    .reset-btn {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        width: 100%;
        padding: 0.55rem 0.7rem;
        border: 1px solid color-mix(in srgb, #e53e3e 20%, var(--border));
        border-radius: 0.5rem;
        background: color-mix(in srgb, #e53e3e 4%, var(--surface-soft));
        color: var(--text);
        font: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
    }

    .reset-btn:hover {
        background: color-mix(in srgb, #e53e3e 10%, var(--surface-soft));
        border-color: color-mix(in srgb, #e53e3e 35%, var(--border));
    }

    .reset-btn svg {
        width: 0.9rem;
        height: 0.9rem;
        fill: none;
        stroke: #e53e3e;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.8;
        flex-shrink: 0;
    }
</style>
