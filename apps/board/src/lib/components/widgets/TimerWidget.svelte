<script lang="ts">
    import WidgetShell from "./WidgetShell.svelte";

    type Props = {
        x: number;
        y: number;
        w: number;
        h: number;
        z: number;
        selected: boolean;
        seconds: number;
        label: string;
        progress: number;
        running: boolean;
        onSetSeconds: (seconds: number) => void;
        onToggle: () => void;
        onReset: () => void;
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
        seconds,
        label,
        progress,
        running,
        onSetSeconds,
        onToggle,
        onReset,
        onSelect,
        onMoveStart,
        onResizeStart,
        onBringForward,
        onSendBackward,
        onDelete,
    }: Props = $props();

    const widgetScale = $derived(Math.max(0.72, Math.min(w / 420, h / 210)));
    const timerStyle = $derived(`--timer-scale:${widgetScale};`);
    const editMode = $derived(selected && !running);
    let expiredAcknowledged = $state(false);
    const isAtZero = $derived(!running && seconds === 0 && progress === 0);
    const expired = $derived(isAtZero && !expiredAcknowledged);

    $effect(() => {
        if (!isAtZero) expiredAcknowledged = false;
    });

    $effect(() => {
        if (isAtZero && selected) expiredAcknowledged = true;
    });
    const totalHours = $derived(Math.floor(Math.max(0, seconds) / 3600));
    const totalMinutes = $derived(Math.floor((Math.max(0, seconds) % 3600) / 60));
    const totalSeconds = $derived(Math.max(0, seconds) % 60);
    const hourDigits = $derived(String(totalHours).padStart(2, "0").slice(-2));
    const minuteDigits = $derived(String(totalMinutes).padStart(2, "0"));
    const secondDigits = $derived(String(totalSeconds).padStart(2, "0"));

    function setDurationFromDigits(nextHourDigits: string, nextMinuteDigits: string) {
        const clampedHours = Math.max(0, Math.min(99, Number.parseInt(nextHourDigits, 10) || 0));
        const clampedMinutes = Math.max(0, Math.min(59, Number.parseInt(nextMinuteDigits, 10) || 0));
        onSetSeconds(clampedHours * 3600 + clampedMinutes * 60);
    }

    function adjustDigit(kind: "hours" | "minutes", position: "tens" | "ones", delta: 1 | -1) {
        const currentHours = String(totalHours).padStart(2, "0").slice(-2).split("");
        const currentMinutes = String(totalMinutes).padStart(2, "0").split("");
        const activeDigits = kind === "hours" ? currentHours : currentMinutes;
        const index = position === "tens" ? 0 : 1;
        const maxDigit =
            kind === "hours"
                ? 9
                : position === "tens"
                    ? 5
                    : 9;

        activeDigits[index] = String(
            Math.max(0, Math.min(maxDigit, Number.parseInt(activeDigits[index], 10) + delta)),
        );

        if (kind === "hours") {
            setDurationFromDigits(activeDigits.join(""), currentMinutes.join(""));
            return;
        }

        setDurationFromDigits(currentHours.join(""), activeDigits.join(""));
    }
</script>

<WidgetShell
    title="Digital timer"
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
    <div class="timer-layout" class:expired style={timerStyle}>
        <div class="timer-header">
            <div class="timer-readout-shell">
                {#if editMode}
                    <div class="timer-edit-overlay timer-edit-overlay-top">
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-hour-tens"
                            aria-label="Öka tiotal timmar"
                            onclick={() => adjustDigit("hours", "tens", 1)}
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-hour-ones"
                            aria-label="Öka ental timmar"
                            onclick={() => adjustDigit("hours", "ones", 1)}
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-minute-tens"
                            aria-label="Öka tiotal minuter"
                            onclick={() => adjustDigit("minutes", "tens", 1)}
                        >
                            ▲
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-minute-ones"
                            aria-label="Öka ental minuter"
                            onclick={() => adjustDigit("minutes", "ones", 1)}
                        >
                            ▲
                        </button>
                    </div>
                {/if}

                {#if editMode}
                    <div class="timer-readout-grid">
                        <span class="timer-readout-digit">{hourDigits[0]}</span>
                        <span class="timer-readout-digit">{hourDigits[1]}</span>
                        <span class="timer-readout-separator">:</span>
                        <span class="timer-readout-digit">{minuteDigits[0]}</span>
                        <span class="timer-readout-digit">{minuteDigits[1]}</span>
                        <span class="timer-readout-separator">:</span>
                        <span class="timer-readout-digit timer-readout-digit-muted">{secondDigits[0]}</span>
                        <span class="timer-readout-digit timer-readout-digit-muted">{secondDigits[1]}</span>
                    </div>
                {:else}
                    <div class="timer-readout-display">
                        <span class="timer-readout-display-text">{label}</span>
                    </div>
                {/if}

                {#if editMode}
                    <div class="timer-edit-overlay timer-edit-overlay-bottom">
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-hour-tens"
                            aria-label="Minska tiotal timmar"
                            onclick={() => adjustDigit("hours", "tens", -1)}
                        >
                            ▼
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-hour-ones"
                            aria-label="Minska ental timmar"
                            onclick={() => adjustDigit("hours", "ones", -1)}
                        >
                            ▼
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-minute-tens"
                            aria-label="Minska tiotal minuter"
                            onclick={() => adjustDigit("minutes", "tens", -1)}
                        >
                            ▼
                        </button>
                        <button
                            type="button"
                            class="editor-arrow editor-arrow-minute-ones"
                            aria-label="Minska ental minuter"
                            onclick={() => adjustDigit("minutes", "ones", -1)}
                        >
                            ▼
                        </button>
                    </div>
                {/if}
            </div>

            <div class="timer-bar">
                <div class="timer-bar-fill" style={`transform: scaleX(${progress});`}></div>
            </div>
        </div>

        <div class="timer-actions">
            <button class:running class="action-button" type="button" onclick={onToggle}>
                <span class="play-pause-icon" aria-hidden="true">
                    {#if running}
                        <span class="pause-bars">
                            <span></span>
                            <span></span>
                        </span>
                    {:else}
                        <span class="play-triangle"></span>
                    {/if}
                </span>
                <span>{running ? "Paus" : "Start"}</span>
            </button>

            <button class="action-button action-button-secondary" type="button" onclick={onReset}>
                Återställ
            </button>
        </div>
    </div>
</WidgetShell>

<style>
    .timer-layout {
        --timer-scale: 1;
        --widget-scale: var(--timer-scale);
        --timer-orange-base: color-mix(in srgb, var(--brand-warm-400) 30%, white);
        --timer-orange-primary: var(--brand-warm-500);
        --timer-orange-strong: var(--brand-warm-600);
        --timer-active-surface: color-mix(in srgb, var(--brand-warm-400) 44%, transparent);
        --timer-active-border: color-mix(in srgb, var(--brand-warm-600) 18%, transparent);
        --timer-active-text: var(--brand-warm-700);
        --timer-digit-column: calc(2.76rem * var(--timer-scale));
        --timer-separator-column: calc(1.34rem * var(--timer-scale));

        display: flex;
        flex-direction: column;
        gap: calc(0.96rem * var(--timer-scale));
        height: 100%;
    }

    :global(.screen-shell[data-theme="dark"]) .timer-layout {
        --timer-orange-base: color-mix(in srgb, var(--brand-warm-400) 18%, transparent);
        --timer-active-surface: color-mix(in srgb, var(--brand-warm-600) 18%, transparent);
        --timer-active-border: color-mix(in srgb, var(--brand-warm-400) 24%, transparent);
        --timer-active-text: var(--brand-warm-400);
    }

    .timer-header {
        display: grid;
        grid-template-rows: minmax(calc(6.6rem * var(--timer-scale)), 1fr) auto;
        gap: calc(0.18rem * var(--timer-scale));
        flex: 1 1 auto;
        min-height: 0;
    }

    .timer-readout-shell {
        display: grid;
        grid-template-columns:
            max-content max-content max-content max-content max-content max-content max-content max-content;
        grid-template-rows: auto auto auto;
        position: relative;
        align-items: center;
        justify-content: center;
        align-content: center;
        row-gap: calc(0.06rem * var(--timer-scale));
        column-gap: calc(0.12rem * var(--timer-scale));
        min-height: 0;
    }

    .timer-readout-display,
    .timer-readout-grid {
        grid-column: 1 / -1;
        grid-row: 2;
        display: grid;
        grid-template-columns:
            max-content max-content max-content max-content max-content max-content max-content max-content;
        align-items: center;
        justify-content: center;
        column-gap: calc(0.12rem * var(--timer-scale));
        font-weight: 700;
        line-height: 0.92;
        letter-spacing: -0.05em;
        font-variant-numeric: tabular-nums;
        color: var(--text);
        position: relative;
        z-index: 1;
    }

    .timer-readout-display {
        font-size: calc(4.85rem * var(--timer-scale));
        align-self: center;
    }

    .timer-readout-display-text {
        grid-column: 1 / -1;
    }

    .timer-readout-grid {
        font-size: calc(4.75rem * var(--timer-scale));
        align-self: center;
        grid-template-columns:
            var(--timer-digit-column)
            var(--timer-digit-column)
            var(--timer-separator-column)
            var(--timer-digit-column)
            var(--timer-digit-column)
            var(--timer-separator-column)
            var(--timer-digit-column)
            var(--timer-digit-column);
        column-gap: 0;
    }

    .timer-readout-digit,
    .timer-readout-separator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .timer-readout-digit {
        min-width: 0;
    }

    .timer-readout-digit-muted {
        color: color-mix(in srgb, var(--text) 62%, white 38%);
    }

    .timer-edit-overlay {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns:
            var(--timer-digit-column)
            var(--timer-digit-column)
            var(--timer-separator-column)
            var(--timer-digit-column)
            var(--timer-digit-column)
            var(--timer-separator-column)
            var(--timer-digit-column)
            var(--timer-digit-column);
        align-items: center;
        justify-content: center;
        column-gap: 0;
        position: relative;
        z-index: 2;
    }

    .timer-edit-overlay-top {
        grid-row: 1;
        align-self: end;
    }

    .timer-edit-overlay-bottom {
        grid-row: 3;
        align-self: start;
    }

    .editor-arrow {
        width: var(--timer-digit-column);
        height: calc(1.02rem * var(--timer-scale));
    }

    .editor-arrow {
        justify-self: center;
        border: none;
        padding: 0;
        background: transparent;
        color: var(--text);
        font: inherit;
        font-size: calc(0.98rem * var(--timer-scale));
        font-weight: 900;
        line-height: 1;
        cursor: pointer;
        pointer-events: auto;
    }

    .editor-arrow:hover {
        color: color-mix(in srgb, var(--text) 88%, white 12%);
    }

    .editor-arrow-hour-tens {
        grid-column: 1;
    }

    .editor-arrow-hour-ones {
        grid-column: 2;
    }

    .editor-arrow-minute-tens {
        grid-column: 4;
    }

    .editor-arrow-minute-ones {
        grid-column: 5;
    }

    .timer-bar {
        height: calc(0.65rem * var(--timer-scale));
        overflow: hidden;
        border-radius: 0.2rem;
        background: var(--timer-orange-base);
        box-shadow: inset 0 0 0 1px rgba(0, 59, 74, 0.12);
    }

    .timer-bar-fill {
        width: 100%;
        height: 100%;
        transform-origin: left center;
        background: linear-gradient(
            90deg,
            var(--timer-orange-strong),
            var(--timer-orange-primary)
        );
    }

    .timer-actions {
        display: flex;
        flex-wrap: wrap;
        gap: calc(0.7rem * var(--timer-scale));
        align-items: flex-start;
        padding-inline: calc(0.12rem * var(--timer-scale));
        margin-top: calc(0.64rem * var(--timer-scale));
        min-width: 0;
    }

    .action-button {
        display: inline-flex;
        flex: 0 1 auto;
        align-items: center;
        gap: calc(0.42rem * var(--timer-scale));
        padding: calc(0.52rem * var(--timer-scale))
            calc(0.88rem * var(--timer-scale));
        border: 1px solid var(--border);
        border-radius: calc(0.45rem * var(--timer-scale));
        background: var(--surface-soft);
        color: var(--text);
        font: inherit;
        font-size: calc(0.96rem * var(--timer-scale));
        font-weight: 700;
        cursor: pointer;
        transition: background 120ms ease;
    }

    .action-button.running {
        border-color: var(--timer-active-border);
        background: var(--timer-active-surface);
        color: var(--timer-active-text);
    }


    .timer-layout.expired .timer-readout-display-text {
        animation: expired-pulse 1.6s ease-in-out infinite;
        color: var(--brand-danger-600);
    }

    .timer-layout.expired .timer-bar-fill {
        background: var(--brand-danger-500);
    }

    @keyframes expired-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
</style>
