<script lang="ts">
    import { onDestroy } from "svelte";
    import WidgetShell from "./WidgetShell.svelte";

    type Props = {
        x: number;
        y: number;
        w: number;
        h: number;
        z: number;
        selected: boolean;
        durationMinutes: number;
        remainingSeconds: number;
        running: boolean;
        onDurationChange: (minutes: number) => void;
        onToggle: () => void;
        onReset: () => void;
        onSelect: () => void;
        onMoveStart: (event: PointerEvent) => void;
        onResizeStart: (event: PointerEvent) => void;
        onBringForward: () => void;
        onSendBackward: () => void;
        onDelete?: () => void;
    };

    type DialLabel = {
        value: number;
        x: number;
        y: number;
    };

    type DialTick = {
        index: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        major: boolean;
    };

    let {
        x,
        y,
        w,
        h,
        z,
        selected,
        durationMinutes,
        remainingSeconds,
        running,
        onDurationChange,
        onToggle,
        onReset,
        onSelect,
        onMoveStart,
        onResizeStart,
        onBringForward,
        onSendBackward,
        onDelete,
    }: Props = $props();

    let dialFaceElement = $state<HTMLDivElement | null>(null);
    let handDragging = $state(false);
    let handDragAngle = $state<number | null>(null);
    let handDragMinutes = $state<number | null>(null);

    const DIAL_CENTER = 50;
    const LABEL_RADIUS = 45;
    const TICK_OUTER_RADIUS = 35.5;
    const MINOR_TICK_INNER_RADIUS = 31.8;
    const MAJOR_TICK_INNER_RADIUS = 29.2;
    const SECTOR_RADIUS = 27.6;
    const HAND_LENGTH = 24;

    function polarToCartesian(radius: number, angleDeg: number) {
        const angleRad = (angleDeg * Math.PI) / 180;
        return {
            x: DIAL_CENTER + Math.cos(angleRad) * radius,
            y: DIAL_CENTER + Math.sin(angleRad) * radius,
        };
    }

    function getDialLabel(minutes: number): DialLabel {
        const angle = getDialAngle(minutes);
        const point = polarToCartesian(LABEL_RADIUS, angle);

        return {
            value: minutes,
            x: point.x,
            y: point.y,
        };
    }

    function getDialAngle(minutes: number) {
        return -90 - minutes * 6;
    }

    function getPointerAngle(clientX: number, clientY: number) {
        if (!dialFaceElement) return null;

        const rect = dialFaceElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;

        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;

        return (Math.atan2(dy, dx) * 180) / Math.PI;
    }

    function getDialTick(index: number): DialTick {
        const angle = getDialAngle(index);
        const major = index % 10 === 0;
        const outer = polarToCartesian(TICK_OUTER_RADIUS, angle);
        const inner = polarToCartesian(
            major ? MAJOR_TICK_INNER_RADIUS : MINOR_TICK_INNER_RADIUS,
            angle,
        );

        return {
            index,
            x1: outer.x,
            y1: outer.y,
            x2: inner.x,
            y2: inner.y,
            major,
        };
    }

    function describeSector(minutes: number) {
        const clampedMinutes = Math.max(0, Math.min(minutes, 60));

        if (clampedMinutes <= 0) return "";
        if (clampedMinutes >= 60) return "";

        const sweep = clampedMinutes * 6;
        const startAngle = -90;
        const endAngle = startAngle - sweep;
        const largeArcFlag = sweep > 180 ? 1 : 0;

        const arcStart = polarToCartesian(SECTOR_RADIUS, startAngle);
        const arcEnd = polarToCartesian(SECTOR_RADIUS, endAngle);

        return [
            `M ${DIAL_CENTER} ${DIAL_CENTER}`,
            `L ${arcStart.x} ${arcStart.y}`,
            `A ${SECTOR_RADIUS} ${SECTOR_RADIUS} 0 ${largeArcFlag} 0 ${arcEnd.x} ${arcEnd.y}`,
            "Z",
        ].join(" ");
    }

    const labels: DialLabel[] = [0, 10, 20, 30, 40, 50].map(getDialLabel);
    const ticks: DialTick[] = Array.from({ length: 60 }, (_, index) =>
        getDialTick(index),
    );

    const totalMinutes = $derived(Math.max(0, Math.min(120, remainingSeconds / 60)));
    const primaryMinutes = $derived(Math.min(totalMinutes, 60));
    const secondaryMinutes = $derived(Math.max(0, totalMinutes - 60));
    const displayMinutes = $derived(totalMinutes > 0 ? totalMinutes % 60 : 0);
    const handAngle = $derived(`${getDialAngle(displayMinutes)}deg`);
    const totalReadout = $derived(formatDuration(remainingSeconds));
    const primarySectorPath = $derived(describeSector(primaryMinutes));
    const secondarySectorPath = $derived(describeSector(secondaryMinutes));
    const widgetScale = $derived(Math.max(0.72, Math.min(w / 420, h / 520)));
    const timerStyle = $derived(`--timer-scale:${widgetScale};`);
    let expiredAcknowledged = $state(false);
    const isAtZero = $derived(!running && remainingSeconds === 0 && durationMinutes > 0);
    const expired = $derived(isAtZero && !expiredAcknowledged);

    $effect(() => {
        if (!isAtZero) expiredAcknowledged = false;
    });

    $effect(() => {
        if (isAtZero && selected) expiredAcknowledged = true;
    });

    function formatDuration(totalSeconds: number) {
        const safeSeconds = Math.max(0, totalSeconds);
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = safeSeconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function handleHandPointerMove(event: PointerEvent) {
        const currentAngle = getPointerAngle(event.clientX, event.clientY);
        if (
            currentAngle === null ||
            handDragAngle === null ||
            handDragMinutes === null
        )
            return;

        let deltaAngle = currentAngle - handDragAngle;

        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;

        const nextMinutes = Math.max(
            0,
            Math.min(120, handDragMinutes - deltaAngle / 6),
        );

        handDragAngle = currentAngle;
        handDragMinutes = nextMinutes;
        onDurationChange(Math.round(nextMinutes));
    }

    function stopHandDrag() {
        handDragging = false;
        handDragAngle = null;
        handDragMinutes = null;
        window.removeEventListener("pointermove", handleHandPointerMove);
        window.removeEventListener("pointerup", stopHandDrag);
    }

    function startHandDrag(event: PointerEvent) {
        if (running) return;

        event.stopPropagation();
        event.preventDefault();
        onSelect();
        const startAngle = getPointerAngle(event.clientX, event.clientY);
        if (startAngle === null) return;
        handDragging = true;
        handDragAngle = startAngle;
        handDragMinutes = totalMinutes;
        window.addEventListener("pointermove", handleHandPointerMove);
        window.addEventListener("pointerup", stopHandDrag);
    }

    onDestroy(() => {
        stopHandDrag();
    });
</script>

<WidgetShell
    title="Analog timer"
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
    <div class="lesson-timer-layout" class:expired style={timerStyle}>
        <div class="dial-card">
            <div class="dial-stage">
                <div class="dial-face" bind:this={dialFaceElement}>
                    <svg
                        class="dial-svg"
                        viewBox="0 0 100 100"
                        aria-hidden="true"
                    >
                        <circle
                            class="dial-sector-base"
                            cx={DIAL_CENTER}
                            cy={DIAL_CENTER}
                            r={SECTOR_RADIUS}
                        ></circle>

                        {#if primaryMinutes >= 60}
                            <circle
                                class="dial-sector-fill dial-sector-fill-primary"
                                cx={DIAL_CENTER}
                                cy={DIAL_CENTER}
                                r={SECTOR_RADIUS}
                            ></circle>
                        {:else if primarySectorPath}
                            <path class="dial-sector-path dial-sector-fill-primary" d={primarySectorPath}
                            ></path>
                        {/if}

                        {#if secondaryMinutes >= 60}
                            <circle
                                class="dial-sector-fill dial-sector-fill-secondary"
                                cx={DIAL_CENTER}
                                cy={DIAL_CENTER}
                                r={SECTOR_RADIUS}
                            ></circle>
                        {:else if secondarySectorPath}
                            <path class="dial-sector-path dial-sector-fill-secondary" d={secondarySectorPath}
                            ></path>
                        {/if}

                        {#each ticks as tick}
                            <line
                                class:major={tick.major}
                                class="dial-tick"
                                x1={tick.x1}
                                y1={tick.y1}
                                x2={tick.x2}
                                y2={tick.y2}
                            ></line>
                        {/each}

                        {#each labels as label}
                            <text class="dial-label" x={label.x} y={label.y}
                                >{label.value}</text
                            >
                        {/each}
                    </svg>

                    <button
                        class:dragging={handDragging}
                        class="dial-hand"
                        type="button"
                        aria-label="Dra för att ställa lektionstiden"
                        style={`transform: translateY(-50%) rotate(${handAngle});`}
                        onpointerdown={startHandDrag}
                    >
                        <span></span>
                    </button>

                    <button
                        class:dragging={handDragging}
                        class="dial-knob"
                        type="button"
                        aria-label="Dra för att ställa lektionstiden"
                        onpointerdown={startHandDrag}
                    ></button>
                </div>

                <div class="dial-controls">
                    <button
                        class:running
                        class="dial-action"
                        type="button"
                        onclick={onToggle}
                    >
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
                        <span class="dial-action-label">
                        {running ? "Paus" : "Start"}
                        </span>
                    </button>

                    <div class="dial-readout" aria-live="polite">
                        <p class="readout-time">{totalReadout}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</WidgetShell>

<style>
    .lesson-timer-layout {
        width: 100%;
        height: 100%;
        --timer-scale: 1;
        --widget-scale: var(--timer-scale);
        --lesson-red-base: var(--brand-danger-300);
        --lesson-red-primary: var(--brand-danger-600);
        --lesson-red-secondary: var(--brand-danger-700);
        --lesson-blue-muted: var(--brand-primary-600);
        --dial-card-surface: rgba(255, 255, 255, 0.96);
        --dial-card-rim: color-mix(in srgb, var(--brand-primary-900) 14%, transparent);
        --dial-card-rim-soft: rgba(255, 255, 255, 0.72);
        --dial-card-shadow: color-mix(in srgb, var(--brand-primary-900) 12%, transparent);
        --dial-face-surface: white;
        --dial-tick-color: color-mix(in srgb, var(--text) 56%, transparent);
        --dial-tick-major: color-mix(in srgb, var(--text) 84%, transparent);
        --dial-label-color: color-mix(in srgb, var(--text) 90%, black);
        --dial-hand-color: color-mix(in srgb, var(--text) 90%, black);
        --dial-knob-ring: color-mix(in srgb, white 76%, transparent);
        --dial-pill-surface: color-mix(in srgb, white 88%, var(--surface));
        --dial-pill-border: color-mix(in srgb, var(--text) 18%, transparent);
        --dial-pill-shadow: color-mix(in srgb, var(--text) 8%, transparent);
    }

    :global(.screen-shell[data-theme="dark"]) .lesson-timer-layout {
        --lesson-red-base: color-mix(in srgb, var(--brand-danger-700) 18%, transparent);
        --lesson-red-primary: var(--brand-danger-600);
        --lesson-red-secondary: var(--brand-danger-700);
        --lesson-blue-muted: var(--brand-primary-300);
        --dial-card-surface: color-mix(in srgb, var(--surface) 82%, transparent);
        --dial-card-rim: color-mix(in srgb, var(--brand-primary-300) 18%, transparent);
        --dial-card-rim-soft: rgba(255, 255, 255, 0.05);
        --dial-card-shadow: rgba(0, 0, 0, 0.28);
        --dial-face-surface: rgba(255, 255, 255, 0.035);
        --dial-tick-color: rgba(246, 251, 252, 0.2);
        --dial-tick-major: rgba(246, 251, 252, 0.52);
        --dial-label-color: rgba(246, 251, 252, 0.64);
        --dial-hand-color: rgba(246, 251, 252, 0.92);
        --dial-knob-ring: rgba(255, 255, 255, 0.24);
        --dial-pill-surface: rgba(7, 32, 43, 0.72);
        --dial-pill-border: rgba(185, 219, 229, 0.14);
        --dial-pill-shadow: rgba(0, 0, 0, 0.18);
    }

    .dial-card {
        position: relative;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: calc(0.95rem * var(--timer-scale));
        border-radius: calc(2rem * var(--timer-scale));
        background: var(--dial-card-surface);
        box-shadow:
            inset 0 0 0 0.28rem var(--dial-card-rim),
            inset 0 0 0 0.48rem var(--dial-card-rim-soft),
            0 1rem 2rem var(--dial-card-shadow);
    }

    .dial-stage {
        position: relative;
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
    }

    .dial-face {
        position: relative;
        width: min(100%, calc(100% - 0.6rem));
        height: auto;
        aspect-ratio: 1;
        max-width: 100%;
        max-height: 100%;
        border-radius: 999px;
        background: var(--dial-face-surface);
        overflow: hidden;
    }

    .dial-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .dial-sector-base {
        fill: var(--lesson-red-base);
    }

    .dial-sector-path,
    .dial-sector-fill {
        opacity: 0.92;
    }

    .dial-sector-fill-primary {
        fill: var(--lesson-red-primary);
    }

    .dial-sector-fill-secondary {
        fill: var(--lesson-red-secondary);
    }

    .dial-tick {
        stroke: var(--dial-tick-color);
        stroke-width: 0.4;
        stroke-linecap: round;
    }

    .dial-tick.major {
        stroke: var(--dial-tick-major);
        stroke-width: 0.82;
    }

    .dial-label {
        font-size: 7.2px;
        font-family: var(--font-body);
        font-weight: 800;
        fill: var(--dial-label-color);
        text-anchor: middle;
        dominant-baseline: middle;
    }

    .dial-hand {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 31%;
        height: 0.3rem;
        padding: 0;
        border: none;
        background: transparent;
        transform-origin: left center;
        cursor: grab;
        z-index: 3;
    }

    .dial-hand.dragging {
        cursor: grabbing;
    }

    .dial-hand span {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: 999px;
        background: var(--dial-hand-color);
        transform-origin: left center;
    }

    .dial-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 5.2%;
        aspect-ratio: 1;
        padding: 0;
        border: none;
        transform: translate(-50%, -50%);
        border-radius: 999px;
        background: var(--dial-hand-color);
        box-shadow: 0 0 0 0.16rem var(--dial-knob-ring);
        cursor: grab;
        z-index: 4;
    }

    .dial-knob.dragging {
        cursor: grabbing;
    }

    .dial-readout {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        min-width: calc(4.8rem * var(--timer-scale));
    }

    .readout-time {
        margin: 0;
        text-align: right;
        font-size: calc(1.08rem * var(--timer-scale));
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 700;
        color: var(--lesson-blue-muted);
    }

    .dial-controls {
        position: absolute;
        left: calc(0.6rem * var(--timer-scale));
        right: calc(0.6rem * var(--timer-scale));
        bottom: calc(0.2rem * var(--timer-scale));
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: calc(0.75rem * var(--timer-scale));
        z-index: 5;
        pointer-events: none;
    }

    .dial-action {
        display: inline-flex;
        align-items: center;
        gap: calc(0.45rem * var(--timer-scale));
        padding: calc(0.52rem * var(--timer-scale))
            calc(0.92rem * var(--timer-scale));
        border: 1px solid var(--dial-pill-border);
        border-radius: 999px;
        background: var(--dial-pill-surface);
        color: var(--text);
        font: inherit;
        font-size: calc(1.08rem * var(--timer-scale));
        font-weight: 700;
        box-shadow: 0 0.35rem 1rem var(--dial-pill-shadow);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        cursor: pointer;
    }

    .dial-action.running {
        border-color: rgba(188, 22, 63, 0.22);
        background: rgba(236, 189, 202, 0.84);
        color: var(--lesson-red-secondary);
    }


    .dial-action-label {
        line-height: 1;
    }

    .lesson-timer-layout.expired .readout-time {
        animation: expired-pulse 1.6s ease-in-out infinite;
        color: var(--brand-danger-600);
    }

    .lesson-timer-layout.expired .dial-sector-base {
        animation: expired-pulse 1.6s ease-in-out infinite;
    }

    @keyframes expired-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }

    .dial-readout {
        padding: calc(0.48rem * var(--timer-scale))
            calc(0.8rem * var(--timer-scale));
        border: 1px solid var(--dial-pill-border);
        border-radius: 999px;
        background: var(--dial-pill-surface);
        box-shadow: 0 0.35rem 1rem var(--dial-pill-shadow);
        backdrop-filter: blur(12px);
    }

</style>
