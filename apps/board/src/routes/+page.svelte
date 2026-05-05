<script lang="ts">
    import AddWidgetMenu from "$lib/components/AddWidgetMenu.svelte";
    import {
        cloneWidgetInstances,
        createPortableBoardDocument,
        createPersistedBoardState,
        deleteBoardLibraryItem,
        getMissingWidgetTypes,
        getBoardLibraryItem,
        isPortableBoardDocumentV1,
        listBoardLibraryItems,
        saveBoardLibraryItem,
        type BoardLibraryItemV1,
        type BoardThemeMode,
        type PersistedBoardStateV1,
        type PortableBoardDocumentV1,
        type TrelsonPins,
        type WidgetInstance,
    } from "$lib/board";
    import FloatingControls from "$lib/components/FloatingControls.svelte";
    import SettingsPanel from "$lib/components/SettingsPanel.svelte";
    import AnalogClockWidget from "$lib/components/widgets/AnalogClockWidget.svelte";
    import DateWidget from "$lib/components/widgets/DateWidget.svelte";
    import DigitalClockWidget from "$lib/components/widgets/DigitalClockWidget.svelte";
    import LcdClockWidget from "$lib/components/widgets/LcdClockWidget.svelte";
    import LessonTimerWidget from "$lib/components/widgets/LessonTimerWidget.svelte";
    import BodyTextWidget from "$lib/components/widgets/BodyTextWidget.svelte";
    import LogoWidget from "$lib/components/widgets/LogoWidget.svelte";
    import TextWidget from "$lib/components/widgets/TextWidget.svelte";
    import TimerWidget from "$lib/components/widgets/TimerWidget.svelte";
    import QrCodeWidget from "$lib/components/widgets/QrCodeWidget.svelte";
    import StopwatchWidget from "$lib/components/widgets/StopwatchWidget.svelte";
    import TrelsonWidget from "$lib/components/widgets/TrelsonWidget.svelte";
	import {
		BODY_TEXT_FONT_VARIANTS,
		config as themeConfig,
        TEXT_WIDGET_BACKGROUND_VARIANTS,
        TEXT_WIDGET_COLOR_VARIANTS,
        TEXT_WIDGET_FONT_VARIANTS,
        type BodyTextFontVariant,
        type TextWidgetBackgroundVariant,
		type TextWidgetColorVariant,
		type TextWidgetFontVariant,
	} from "$lib/theme";
	import {
		config as variantConfig,
		type WidgetDefaultLayout,
		type WidgetType,
		type WidgetReadiness,
	} from "$lib/variant";
	import { onMount } from "svelte";

	type Theme = BoardThemeMode;
    type WidgetConstraint = {
        minW: number;
        minH: number;
        keepAspect: boolean;
        aspectRatio?: number;
        autoWidth?: boolean;
    };
    type DragState = {
        id: string;
        offsetX: number;
        offsetY: number;
    };
    type ResizeState = {
        id: string;
        startX: number;
        startY: number;
        startW: number;
        startH: number;
    };
    type BoardSize = {
        width: number;
        height: number;
    };
    const INITIAL_BOARD_WIDTH = 1366;
    const INITIAL_BOARD_HEIGHT = 768;
    const GRID_SIZE = 16;
    const STORAGE_KEY = "lektionsvy.board.v1";
    const STORAGE_SAVE_DELAY_MS = 180;
    const TRELSON_EDIT_SECTION_COUNT = 5;
    const TRELSON_SECTION_SCALE = 0.155;
    const TRELSON_SECTION_GAP_FACTOR = 0.18;
    const trelsonEnabled = themeConfig.features.trelson;
	const textWidgetFontVariants = [...TEXT_WIDGET_FONT_VARIANTS];
	const bodyTextFontVariants = [...BODY_TEXT_FONT_VARIANTS];
	const textWidgetBackgroundVariants = [...TEXT_WIDGET_BACKGROUND_VARIANTS];
	const textWidgetColorVariants = [...TEXT_WIDGET_COLOR_VARIANTS];
	const variantWidgetEntries = Object.entries(variantConfig.widgets) as [
		WidgetType,
		{
			label: string;
			readiness: { status: WidgetReadiness; note?: string };
			enabled: boolean;
			defaultLayout: WidgetDefaultLayout;
		},
	][];
	const widgetLabels = Object.fromEntries(
		variantWidgetEntries.map(([type, widget]) => [type, widget.label]),
	) as Record<WidgetType, string>;
	const widgetReadiness = Object.fromEntries(
		variantWidgetEntries.map(([type, widget]) => [type, widget.readiness]),
	) as Record<WidgetType, { status: WidgetReadiness; note?: string }>;

    const digitalTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
    });

    const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    const widgetConstraints: Record<WidgetType, WidgetConstraint> = {
        logo: {
            minW: 180,
            minH: 44,
            keepAspect: true,
            aspectRatio: themeConfig.logos.aspectRatio,
        },
        date: { minW: 160, minH: 24, keepAspect: false, autoWidth: true },
        digital: { minW: 160, minH: 72, keepAspect: false, autoWidth: true },
        lcd: { minW: 240, minH: 80, keepAspect: true, aspectRatio: 2.64 },
        text: { minW: 140, minH: 40, keepAspect: false, autoWidth: true },
        bodyText: { minW: 220, minH: 140, keepAspect: false },
        analog: { minW: 220, minH: 220, keepAspect: true, aspectRatio: 1 },
        lessonTimer: {
            minW: 320,
            minH: 300,
            keepAspect: true,
            aspectRatio: 1.1,
        },
        timer: { minW: 320, minH: 170, keepAspect: true, aspectRatio: 2 },
        stopwatch: { minW: 340, minH: 140, keepAspect: true, aspectRatio: 2.5 },
        qrcode: { minW: 180, minH: 200, keepAspect: false },
        trelson: { minW: 220, minH: 120, keepAspect: false },
    };

	const widgetDefaults = Object.fromEntries(
		variantWidgetEntries.map(([type, widget]) => [type, widget.defaultLayout]),
	) as Record<WidgetType, WidgetDefaultLayout>;
	const enabledWidgetTypes = variantWidgetEntries
		.filter(
			([type, widget]) => widget.enabled && (trelsonEnabled || type !== "trelson"),
		)
		.map(([type]) => type);
	const initialWidgetTypes = variantConfig.initialBoard.widgets.filter((type) =>
		enabledWidgetTypes.includes(type),
	);

    let widgetIdCounter = 0;
    const defaultTrelsonPins: TrelsonPins = {
        start: "",
        resume: "",
        submit: "",
        close: "",
    };

    function getWidgetInitialState(type: WidgetType) {
        return variantConfig.widgets[type].initialState;
    }

    function nextWidgetId(type: WidgetType) {
        widgetIdCounter += 1;
        return `${type}-${widgetIdCounter}`;
    }

    function setWidgetIdCounterFromWidgets(instances: WidgetInstance[]) {
        widgetIdCounter = instances.reduce((maxId, widget) => {
            const suffix = Number(widget.id.match(/-(\d+)$/)?.[1] ?? 0);
            return Math.max(maxId, suffix);
        }, 0);
    }

    let boardElement = $state<HTMLElement | null>(null);
    let now = $state(new Date());
    let theme = $state<Theme>("light");
    let addMenuOpen = $state(false);
    let settingsOpen = $state(false);
    let showGrid = $state(false);
    let snapToGrid = $state(false);
    let defaultLayout = $state(true);
    let fullscreenActive = $state(false);
    let fullscreenHintVisible = $state(false);
    let fullscreenDockVisible = $state(false);
    let fullscreenDockTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const FULLSCREEN_DOCK_TRIGGER_ZONE = 80;
    const FULLSCREEN_DOCK_HIDE_DELAY = 2400;
    let selectedWidgetId = $state<string | null>(null);
    let dragState = $state<DragState | null>(null);
    let resizeState = $state<ResizeState | null>(null);
    let lastBoardSize = $state<BoardSize | null>(null);
    let boardLibraryItems = $state<BoardLibraryItemV1[]>([]);
    let storageReady = false;
    let widgets = $state<WidgetInstance[]>(
        createInitialWidgets(INITIAL_BOARD_WIDTH, INITIAL_BOARD_HEIGHT),
    );

    const digitalTime = $derived(digitalTimeFormatter.format(now));
    const currentDate = $derived(dateFormatter.format(now));
    const secondAngle = $derived(now.getSeconds() * 6);
    const minuteAngle = $derived(now.getMinutes() * 6 + now.getSeconds() * 0.1);
    const hourAngle = $derived(
        ((now.getHours() % 12) + now.getMinutes() / 60) * 30,
    );
    const activeLogo = $derived(
        theme === "dark" ? themeConfig.logos.dark : themeConfig.logos.light,
    );
    const hasWidgets = $derived(widgets.length > 0);
    const showBoardGuide = $derived(!hasWidgets || defaultLayout);
    const orderedWidgets = $derived([...widgets].sort((a, b) => a.z - b.z));
    const widgetMenuEntries = $derived(
        enabledWidgetTypes.map((type) => ({
            key: type,
            label: widgetLabels[type],
            count: widgets.filter((widget) => widget.type === type).length,
            status: widgetReadiness[type].status,
            note: widgetReadiness[type].note,
            onAdd: () => addWidget(type),
        })),
    );

    function getBoardSize() {
        const rect = boardElement?.getBoundingClientRect();

        return {
            width: rect?.width ?? INITIAL_BOARD_WIDTH,
            height: rect?.height ?? INITIAL_BOARD_HEIGHT,
        };
    }

    function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

    function getTopZ() {
        return widgets.reduce((maxZ, widget) => Math.max(maxZ, widget.z), 0);
    }

    function findWidget(id: string) {
        return widgets.find((widget) => widget.id === id);
    }

    function getPersistedTrelsonSectionCount(widget: WidgetInstance) {
        const filledCount = Object.values(
            widget.trelsonPins ?? defaultTrelsonPins,
        ).filter((value) => value.trim().length > 0).length;

        return Math.max(2, 1 + filledCount);
    }

    function createWidgetInstance(
        type: WidgetType,
        boardWidth = INITIAL_BOARD_WIDTH,
        boardHeight = INITIAL_BOARD_HEIGHT,
        options?: {
            useDefaultZ?: boolean;
            offsetIndex?: number;
        },
    ): WidgetInstance {
        if (!enabledWidgetTypes.includes(type)) {
            throw new Error(
                `Widget type "${type}" is disabled in the active theme.`,
            );
        }

        const widget = widgetDefaults[type];
        const constraints = widgetConstraints[type];
        const projectedScaleHeight =
            widget.scaleH !== undefined
                ? Math.round(widget.scaleH * boardHeight)
                : undefined;
        const projectedWidth =
            widget.w !== undefined
                ? Math.round(widget.w * boardWidth)
                : constraints.minW;
        const projectedHeight =
            projectedScaleHeight !== undefined
                ? projectedScaleHeight
                : widget.h !== undefined
                  ? Math.round(widget.h * boardHeight)
                  : constraints.keepAspect && constraints.aspectRatio
                    ? Math.round(projectedWidth / constraints.aspectRatio)
                    : constraints.minH;
        const width = Math.max(constraints.minW, projectedWidth);
        const height = Math.max(constraints.minH, projectedHeight);
        const offsetPixels = (options?.offsetIndex ?? 0) * 24;

        const instance: WidgetInstance = {
            id: nextWidgetId(type),
            type,
            x: Math.max(
                0,
                Math.min(
                    Math.round(widget.x * boardWidth) + offsetPixels,
                    boardWidth - width,
                ),
            ),
            y: Math.max(
                0,
                Math.min(
                    Math.round(widget.y * boardHeight) + offsetPixels,
                    boardHeight - height,
                ),
            ),
            w: width,
            h: height,
            z: options?.useDefaultZ ? widget.z : getTopZ() + 1,
        };

        if (projectedScaleHeight !== undefined) {
            instance.scaleH = projectedScaleHeight;
        }

        if (type === "text") {
            instance.textValue =
                getWidgetInitialState(type)?.textValue ?? "Skriv rubrik";
            instance.textFont = themeConfig.textWidget.defaultFont;
            instance.textBackground = themeConfig.textWidget.defaultBackground;
            instance.textColor = themeConfig.textWidget.defaultColor;
        }

        if (type === "bodyText") {
            instance.textValue =
                getWidgetInitialState(type)?.textValue ??
                "Skriv instruktioner här...";
            instance.bodyTextFont = themeConfig.bodyText.defaultFont;
            instance.textBackground = themeConfig.textWidget.defaultBackground;
            instance.textColor = themeConfig.textWidget.defaultColor;
        }

        if (type === "timer") {
            const defaultDuration =
                getWidgetInitialState(type)?.timerDuration ?? 15 * 60;
            instance.timerDuration = defaultDuration;
            instance.timerRemaining = defaultDuration;
            instance.timerRunning = false;
        }

        if (type === "lessonTimer") {
            const defaultDurationMinutes =
                getWidgetInitialState(type)?.lessonTimerDurationMinutes ?? 60;
            instance.lessonTimerDurationMinutes = defaultDurationMinutes;
            instance.lessonTimerRemaining = defaultDurationMinutes * 60;
            instance.lessonTimerRunning = false;
        }

        if (type === "stopwatch") {
            instance.stopwatchStartTime = null;
            instance.stopwatchAccumulated = 0;
            instance.stopwatchRunning = false;
            instance.stopwatchLaps = [];
        }

        if (type === "qrcode") {
            instance.qrValue = getWidgetInitialState(type)?.qrValue ?? "";
        }

        if (type === "trelson") {
            instance.trelsonPins = {
                ...defaultTrelsonPins,
                ...getWidgetInitialState(type)?.trelsonPins,
            };
            instance.h = getTrelsonHeight(
                instance.w,
                TRELSON_EDIT_SECTION_COUNT,
            );
        }

        return instance;
    }

    function restoreWidgetInstance(
        widget: Partial<WidgetInstance>,
        boardWidth: number,
        boardHeight: number,
    ): WidgetInstance | null {
        if (!widget.type || !enabledWidgetTypes.includes(widget.type)) {
            return null;
        }

        const restored = {
            ...createWidgetInstance(widget.type, boardWidth, boardHeight, {
                useDefaultZ: true,
            }),
            ...widget,
            id:
                typeof widget.id === "string" && widget.id.length > 0
                    ? widget.id
                    : nextWidgetId(widget.type),
            type: widget.type,
        } satisfies WidgetInstance;

        const constraints = widgetConstraints[restored.type];

        restored.w = clamp(
            Number(restored.w) || constraints.minW,
            constraints.minW,
            boardWidth,
        );

        if (restored.type === "trelson") {
            restored.h = getTrelsonHeight(
                restored.w,
                getPersistedTrelsonSectionCount(restored),
            );
        } else if (constraints.keepAspect && constraints.aspectRatio) {
            restored.h = restored.w / constraints.aspectRatio;
        } else {
            restored.h = clamp(
                Number(restored.h) || constraints.minH,
                constraints.minH,
                boardHeight,
            );
        }

        const maxX = Math.max(0, boardWidth - restored.w);
        const maxY = Math.max(0, boardHeight - restored.h);

        restored.x = clamp(Number(restored.x) || 0, 0, maxX);
        restored.y = clamp(Number(restored.y) || 0, 0, maxY);
        restored.z = Math.max(1, Math.floor(Number(restored.z) || 1));

        if (constraints.autoWidth) {
            restored.scaleH = clamp(
                Number(restored.scaleH ?? restored.h) || restored.h,
                constraints.minH,
                boardHeight,
            );
        }

        if (restored.type === "timer") {
            const defaultDuration =
                getWidgetInitialState(restored.type)?.timerDuration ?? 15 * 60;
            restored.timerDuration = clamp(
                Math.floor(Number(restored.timerDuration) || defaultDuration),
                0,
                359999,
            );
            restored.timerRemaining = clamp(
                Math.floor(
                    Number(restored.timerRemaining) || restored.timerDuration,
                ),
                0,
                restored.timerDuration,
            );
            restored.timerRunning = false;
        }

        if (restored.type === "lessonTimer") {
            const defaultDurationMinutes =
                getWidgetInitialState(restored.type)?.lessonTimerDurationMinutes ??
                60;
            restored.lessonTimerDurationMinutes = clamp(
                Math.floor(
                    Number(restored.lessonTimerDurationMinutes) ||
                        defaultDurationMinutes,
                ),
                0,
                120,
            );
            restored.lessonTimerRemaining = clamp(
                Math.floor(
                    Number(
                        restored.lessonTimerRemaining ??
                            restored.lessonTimerDurationMinutes * 60,
                    ),
                ) || 0,
                0,
                restored.lessonTimerDurationMinutes * 60,
            );
            restored.lessonTimerRunning = false;
        }

        if (restored.type === "stopwatch") {
            restored.stopwatchStartTime = null;
            restored.stopwatchRunning = false;
            restored.stopwatchAccumulated = Math.max(
                0,
                Math.floor(Number(restored.stopwatchAccumulated) || 0),
            );
            restored.stopwatchLaps = Array.isArray(restored.stopwatchLaps)
                ? restored.stopwatchLaps
                      .map((lap) => Math.max(0, Math.floor(Number(lap) || 0)))
                      .filter((lap) => lap > 0)
                : [];
        }

        if (restored.type === "text") {
            restored.textFont = textWidgetFontVariants.includes(
                restored.textFont ?? themeConfig.textWidget.defaultFont,
            )
                ? (restored.textFont as TextWidgetFontVariant)
                : themeConfig.textWidget.defaultFont;
            restored.textBackground = textWidgetBackgroundVariants.includes(
                restored.textBackground ??
                    themeConfig.textWidget.defaultBackground,
            )
                ? (restored.textBackground as TextWidgetBackgroundVariant)
                : themeConfig.textWidget.defaultBackground;
            restored.textColor = textWidgetColorVariants.includes(
                restored.textColor ?? themeConfig.textWidget.defaultColor,
            )
                ? (restored.textColor as TextWidgetColorVariant)
                : themeConfig.textWidget.defaultColor;
        }

        if (restored.type === "bodyText") {
            restored.bodyTextFont = bodyTextFontVariants.includes(
                restored.bodyTextFont ?? themeConfig.bodyText.defaultFont,
            )
                ? (restored.bodyTextFont as BodyTextFontVariant)
                : themeConfig.bodyText.defaultFont;
            restored.textBackground = textWidgetBackgroundVariants.includes(
                restored.textBackground ??
                    themeConfig.textWidget.defaultBackground,
            )
                ? (restored.textBackground as TextWidgetBackgroundVariant)
                : themeConfig.textWidget.defaultBackground;
            restored.textColor = textWidgetColorVariants.includes(
                restored.textColor ?? themeConfig.textWidget.defaultColor,
            )
                ? (restored.textColor as TextWidgetColorVariant)
                : themeConfig.textWidget.defaultColor;
        }

        if (restored.type === "qrcode") {
            restored.qrValue =
                typeof restored.qrValue === "string"
                    ? restored.qrValue
                    : (getWidgetInitialState(restored.type)?.qrValue ?? "");
        }

        if (restored.type === "trelson") {
            restored.trelsonPins = {
                ...defaultTrelsonPins,
                ...getWidgetInitialState(restored.type)?.trelsonPins,
                ...restored.trelsonPins,
            };
        }

        return restored;
    }

    function loadPersistedBoardState(
        boardWidth: number,
        boardHeight: number,
    ): PersistedBoardStateV1 | null {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);

            if (!raw) return null;

            const parsed = JSON.parse(raw) as Partial<PersistedBoardStateV1>;

            if (parsed.version !== 1 || !Array.isArray(parsed.widgets)) {
                return null;
            }

            const restoredWidgets = parsed.widgets
                .map((widget) =>
                    restoreWidgetInstance(widget, boardWidth, boardHeight),
                )
                .filter((widget): widget is WidgetInstance => widget !== null)
                .sort((a, b) => a.z - b.z);

            return {
                version: 1,
                theme:
                    parsed.theme === "dark"
                        ? "dark"
                        : parsed.board?.darkMode
                          ? "dark"
                          : "light",
                board: {
                    darkMode: parsed.board?.darkMode,
                    showGrid: Boolean(parsed.board?.showGrid ?? parsed.showGrid),
                    snapToGrid: Boolean(parsed.board?.snapToGrid ?? parsed.snapToGrid),
                    defaultLayout: Boolean(
                        parsed.board?.defaultLayout ?? parsed.defaultLayout,
                    ),
                },
                widgets:
                    restoredWidgets.length > 0
                        ? restoredWidgets
                        : createInitialWidgets(boardWidth, boardHeight),
            };
        } catch (error) {
            console.warn("Failed to load saved board state", error);
            return null;
        }
    }

    function savePersistedBoardState(snapshot: PersistedBoardStateV1) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (error) {
            console.warn("Failed to save board state", error);
        }
    }

    function createPersistedBoardSnapshot(): PersistedBoardStateV1 {
        return createPersistedBoardState({
            theme,
            showGrid,
            snapToGrid,
            defaultLayout,
            widgets: cloneWidgetInstances(widgets),
        });
    }

    function createPortableBoardSnapshot(): PortableBoardDocumentV1 {
        return createPortableBoardDocument({
            theme,
            showGrid,
            snapToGrid,
            defaultLayout,
            widgets: cloneWidgetInstances(widgets),
            meta: {
                exportedAt: new Date().toISOString(),
            },
        });
    }

    async function refreshBoardLibrary() {
        if (typeof window === "undefined") return;

        try {
            boardLibraryItems = await listBoardLibraryItems();
        } catch (error) {
            console.warn("Failed to load board library", error);
        }
    }

    async function saveCurrentBoard(kind: BoardLibraryItemV1["kind"]) {
        if (typeof window === "undefined") return;

        const suggestedName =
            kind === "template"
                ? `Mall ${new Date().toLocaleDateString("sv-SE")}`
                : `Tavla ${new Date().toLocaleDateString("sv-SE")}`;
        const name = window.prompt(
            kind === "template"
                ? "Namn på mallen:"
                : "Namn på den sparade tavlan:",
            suggestedName,
        );

        if (!name || !name.trim()) return;

        try {
            await saveBoardLibraryItem({
                name: name.trim(),
                kind,
                board: createPortableBoardDocument({
                    theme,
                    showGrid,
                    snapToGrid,
                    defaultLayout,
                    widgets: cloneWidgetInstances(widgets),
                    meta: {
                        name: name.trim(),
                        exportedAt: new Date().toISOString(),
                    },
                }),
            });
            await refreshBoardLibrary();
        } catch (error) {
            console.warn("Failed to save board locally", error);
            window.alert("Det gick inte att spara tavlan lokalt.");
        }
    }

    function applyPortableBoard(document: PortableBoardDocumentV1) {
        const missingWidgetTypes = getMissingWidgetTypes(
            document,
            enabledWidgetTypes,
        );
        const { width, height } = getBoardSize();
        const restoredWidgets = document.widgets
            .map((widget) => restoreWidgetInstance(widget, width, height))
            .filter((widget): widget is WidgetInstance => widget !== null)
            .sort((a, b) => a.z - b.z);

        if (restoredWidgets.length === 0) {
            window.alert(
                "Den importerade tavlan innehöll inga widgets som stöds i den här varianten.",
            );
            return false;
        }

        widgets = restoredWidgets;
        if (typeof document.board.darkMode === "boolean") {
            theme = document.board.darkMode ? "dark" : "light";
        }
        setWidgetIdCounterFromWidgets(restoredWidgets);
        showGrid = document.board.showGrid;
        snapToGrid = document.board.snapToGrid;
        defaultLayout = document.board.defaultLayout;
        selectedWidgetId = null;
        dragState = null;
        resizeState = null;
        addMenuOpen = false;
        settingsOpen = false;
        flushPersistedBoardState();

        if (missingWidgetTypes.length > 0) {
            const missingNames = missingWidgetTypes
                .map((type) => widgetLabels[type] ?? type)
                .join(", ");

            window.alert(
                `Tavlan importerades, men vissa widgets kunde inte visas i den här varianten: ${missingNames}.`,
            );
        }

        return true;
    }

    function exportBoard() {
        if (typeof window === "undefined") return;

        const snapshot = createPortableBoardSnapshot();
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
            type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        const dateStamp = new Date().toISOString().slice(0, 10);

        anchor.href = url;
        anchor.download = `lektionsvy-board-${dateStamp}.json`;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
    }

    async function importBoard(file: File) {
        try {
            const raw = await file.text();
            const parsed = JSON.parse(raw) as unknown;

            if (!isPortableBoardDocumentV1(parsed)) {
                window.alert("Filen verkar inte vara en giltig Lektionsvy-board.");
                return;
            }

            applyPortableBoard(parsed);
        } catch (error) {
            console.warn("Failed to import board", error);
            window.alert("Det gick inte att importera tavlan. Kontrollera att filen är giltig JSON.");
        }
    }

    async function loadBoardFromLibrary(id: string) {
        try {
            const item = await getBoardLibraryItem(id);

            if (!item) {
                window.alert("Den sparade tavlan kunde inte hittas.");
                await refreshBoardLibrary();
                return;
            }

            applyPortableBoard(item.board);
        } catch (error) {
            console.warn("Failed to load board from library", error);
            window.alert("Det gick inte att läsa den sparade tavlan.");
        }
    }

    async function removeBoardFromLibrary(id: string) {
        const item = boardLibraryItems.find((entry) => entry.id === id);
        const label = item?.name ?? "den sparade tavlan";

        if (!window.confirm(`Ta bort ${label}?`)) return;

        try {
            await deleteBoardLibraryItem(id);
            await refreshBoardLibrary();
        } catch (error) {
            console.warn("Failed to delete board from library", error);
            window.alert("Det gick inte att ta bort den sparade tavlan.");
        }
    }

    function flushPersistedBoardState() {
        if (!storageReady || typeof window === "undefined") {
            return;
        }

        savePersistedBoardState(createPersistedBoardSnapshot());
    }

    $effect(() => {
        if (!storageReady || typeof window === "undefined") {
            return;
        }

        const snapshot = createPersistedBoardSnapshot();

        const timeoutId = window.setTimeout(() => {
            savePersistedBoardState(snapshot);
        }, STORAGE_SAVE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    });

    function createInitialWidgets(
        boardWidth = INITIAL_BOARD_WIDTH,
        boardHeight = INITIAL_BOARD_HEIGHT,
    ) {
        return initialWidgetTypes
            .map((type) =>
                createWidgetInstance(type, boardWidth, boardHeight, {
                    useDefaultZ: true,
                }),
            )
            .sort((a, b) => a.z - b.z);
    }

    function addWidget(type: WidgetType) {
        if (!enabledWidgetTypes.includes(type)) return;

        const { width, height } = getBoardSize();
        const offsetIndex = widgets.filter(
            (widget) => widget.type === type,
        ).length;
        const nextWidget = createWidgetInstance(type, width, height, {
            offsetIndex,
        });

        widgets = [...widgets, nextWidget];
        defaultLayout = false;
        selectedWidgetId = nextWidget.id;
        syncTrelsonHeight(nextWidget.id, true);
    }

    function getTrelsonSectionCount(
        widget: WidgetInstance,
        selected = selectedWidgetId === widget.id,
    ) {
        if (widget.type !== "trelson") return 0;
        if (selected) return TRELSON_EDIT_SECTION_COUNT;

        const filledCount = Object.values(
            widget.trelsonPins ?? defaultTrelsonPins,
        ).filter((value) => value.trim().length > 0).length;

        return Math.max(2, 1 + filledCount);
    }

    function getTrelsonSectionHeightFromWidth(width: number) {
        return Math.max(44, width * TRELSON_SECTION_SCALE);
    }

    function getTrelsonGapFromSectionHeight(sectionHeight: number) {
        return sectionHeight * TRELSON_SECTION_GAP_FACTOR;
    }

    function getTrelsonHeight(width: number, sectionCount: number) {
        const sectionHeight = getTrelsonSectionHeightFromWidth(width);
        const sectionGap = getTrelsonGapFromSectionHeight(sectionHeight);

        return Math.round(
            sectionHeight * sectionCount + sectionGap * (sectionCount - 1),
        );
    }

    function getTrelsonWidthFromHeight(height: number, sectionCount: number) {
        const sectionUnit =
            TRELSON_SECTION_SCALE *
            (sectionCount + TRELSON_SECTION_GAP_FACTOR * (sectionCount - 1));

        return height / sectionUnit;
    }

    function syncTrelsonHeight(id: string, forceSelected?: boolean) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "trelson") return;

        const sectionCount = getTrelsonSectionCount(
            widget,
            forceSelected ?? selectedWidgetId === id,
        );

        widget.h = getTrelsonHeight(widget.w, sectionCount);
        widgets = [...widgets];
    }

    function selectWidget(id: string) {
        if (selectedWidgetId && selectedWidgetId !== id) {
            syncTrelsonHeight(selectedWidgetId, false);
        }
        selectedWidgetId = id;
        syncTrelsonHeight(id, true);
    }

    function removeWidget(id: string) {
        widgets = widgets.filter((widget) => widget.id !== id);
        defaultLayout = false;

        if (selectedWidgetId === id) {
            selectedWidgetId = null;
        }
    }

    function moveWidgetLayer(id: string, direction: "forward" | "backward") {
        const orderedIds = [...widgets]
            .sort((a, b) => a.z - b.z)
            .map((widget) => widget.id);
        const currentIndex = orderedIds.indexOf(id);

        if (currentIndex === -1) return;

        const swapIndex =
            direction === "forward" ? currentIndex + 1 : currentIndex - 1;

        if (swapIndex < 0 || swapIndex >= orderedIds.length) return;

        const widget = findWidget(id);
        const otherWidget = findWidget(orderedIds[swapIndex]);

        if (!widget || !otherWidget) return;

        const currentZ = widget.z;
        widget.z = otherWidget.z;
        otherWidget.z = currentZ;
        widgets = [...widgets];
    }

    function setDigitalTimerSeconds(id: string, totalSeconds: number) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "timer") return;

        const nextSeconds = Math.max(
            0,
            Math.min(359999, Math.floor(totalSeconds)),
        );
        widget.timerDuration = nextSeconds;
        widget.timerRemaining = nextSeconds;
        widget.timerRunning = false;
        widgets = [...widgets];
    }

    function toggleTimer(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "timer") return;

        if ((widget.timerRemaining ?? 0) === 0) {
            widget.timerRemaining = widget.timerDuration ?? 0;
        }

        widget.timerRunning = !widget.timerRunning;
        widgets = [...widgets];
    }

    function resetTimer(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "timer") return;

        widget.timerRemaining = widget.timerDuration ?? 0;
        widget.timerRunning = false;
        widgets = [...widgets];
    }

    function setLessonTimerDuration(id: string, minutes: number) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "lessonTimer") return;

        const nextMinutes = Math.max(0, Math.min(minutes, 120));
        widget.lessonTimerDurationMinutes = nextMinutes;
        widget.lessonTimerRemaining = nextMinutes * 60;
        widget.lessonTimerRunning = false;
        widgets = [...widgets];
    }

    function toggleLessonTimer(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "lessonTimer") return;

        if ((widget.lessonTimerRemaining ?? 0) === 0) {
            widget.lessonTimerRemaining =
                (widget.lessonTimerDurationMinutes ?? 0) * 60;
        }

        widget.lessonTimerRunning = !widget.lessonTimerRunning;
        widgets = [...widgets];
    }

    function resetLessonTimer(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "lessonTimer") return;

        widget.lessonTimerRemaining =
            (widget.lessonTimerDurationMinutes ?? 0) * 60;
        widget.lessonTimerRunning = false;
        widgets = [...widgets];
    }

    function getStopwatchElapsed(widget: WidgetInstance) {
        const accumulated = widget.stopwatchAccumulated ?? 0;
        if (widget.stopwatchRunning && widget.stopwatchStartTime) {
            return accumulated + (Date.now() - widget.stopwatchStartTime);
        }
        return accumulated;
    }

    function toggleStopwatch(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "stopwatch") return;
        if (widget.stopwatchRunning) {
            const elapsed = getStopwatchElapsed(widget);
            widget.stopwatchAccumulated = elapsed;
            widget.stopwatchStartTime = null;
            widget.stopwatchRunning = false;
        } else {
            widget.stopwatchStartTime = Date.now();
            widget.stopwatchRunning = true;
        }
        widgets = [...widgets];
    }

    function resetStopwatch(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "stopwatch") return;
        widget.stopwatchStartTime = null;
        widget.stopwatchAccumulated = 0;
        widget.stopwatchRunning = false;
        widget.stopwatchLaps = [];
        widgets = [...widgets];
    }

    function lapStopwatch(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "stopwatch") return;
        const elapsed = getStopwatchElapsed(widget);
        widget.stopwatchLaps = [elapsed, ...(widget.stopwatchLaps ?? [])];
        widgets = [...widgets];
    }

    function updateQrValue(id: string, value: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "qrcode") return;
        widget.qrValue = value;
        widgets = [...widgets];
    }

    function toggleTheme() {
        theme = theme === "light" ? "dark" : "light";
    }

    function toggleTextWidgetFont(id: string) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "text") return;
        const currentIndex = textWidgetFontVariants.indexOf(
            widget.textFont ?? themeConfig.textWidget.defaultFont,
        );
        const nextIndex = (currentIndex + 1) % textWidgetFontVariants.length;

        widget.textFont = textWidgetFontVariants[nextIndex];
        widgets = [...widgets];
    }

    function setTextWidgetBackground(
        id: string,
        background: TextWidgetBackgroundVariant,
    ) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "text") return;
        widget.textBackground = background;
        widgets = [...widgets];
    }

    function setTextWidgetColor(id: string, color: TextWidgetColorVariant) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "text") return;
        widget.textColor = color;
        widgets = [...widgets];
    }

    function updateTextWidgetValue(id: string, value: string) {
        const widget = findWidget(id);
        if (!widget || (widget.type !== "text" && widget.type !== "bodyText"))
            return;

        widget.textValue = value;
        widgets = [...widgets];
    }

    function setBodyTextWidgetFont(id: string, font: BodyTextFontVariant) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "bodyText") return;

        widget.bodyTextFont = font;
        widgets = [...widgets];
    }

    function setBodyTextWidgetBackground(
        id: string,
        background: TextWidgetBackgroundVariant,
    ) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "bodyText") return;

        widget.textBackground = background;
        widgets = [...widgets];
    }

    function setBodyTextWidgetColor(
        id: string,
        color: TextWidgetColorVariant,
    ) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "bodyText") return;

        widget.textColor = color;
        widgets = [...widgets];
    }

    function updateTrelsonPin(
        id: string,
        field: keyof TrelsonPins,
        value: string,
    ) {
        const widget = findWidget(id);
        if (!widget || widget.type !== "trelson") return;

        const sanitized = value.replace(/\D/g, "").slice(0, 8);
        widget.trelsonPins = {
            ...defaultTrelsonPins,
            ...widget.trelsonPins,
            [field]: sanitized,
        };
        syncTrelsonHeight(id);
    }

    function toggleShowGrid() {
        showGrid = !showGrid;
    }

    function toggleSnapToGrid() {
        snapToGrid = !snapToGrid;
        if (snapToGrid) {
            showGrid = true;
        }
    }

    function resetBoard() {
        if (
            !window.confirm(
                "Återställ tavlan till standardlayout? Alla lokalt sparade ändringar försvinner.",
            )
        ) {
            return;
        }

        const { width, height } = getBoardSize();

        window.localStorage.removeItem(STORAGE_KEY);
        widgets = createInitialWidgets(width, height);
        setWidgetIdCounterFromWidgets(widgets);
        theme = "light";
        showGrid = false;
        snapToGrid = false;
        defaultLayout = true;
        selectedWidgetId = null;
        dragState = null;
        resizeState = null;
        addMenuOpen = false;
        settingsOpen = false;
        flushPersistedBoardState();
    }

    function closeMenus() {
        addMenuOpen = false;
        settingsOpen = false;
        if (fullscreenActive) scheduleFullscreenDockHide();
    }

    function toggleAddMenu() {
        addMenuOpen = !addMenuOpen;
        if (addMenuOpen) {
            settingsOpen = false;
            if (fullscreenActive) clearFullscreenDockTimeout();
        } else if (fullscreenActive) {
            scheduleFullscreenDockHide();
        }
    }

    function toggleSettings() {
        settingsOpen = !settingsOpen;
        if (settingsOpen) {
            addMenuOpen = false;
            if (fullscreenActive) clearFullscreenDockTimeout();
        } else if (fullscreenActive) {
            scheduleFullscreenDockHide();
        }
    }

    async function toggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            await document.documentElement.requestFullscreen();
        } catch (error) {
            console.error("Fullscreen failed", error);
        }
    }

    function clearFullscreenDockTimeout() {
        if (fullscreenDockTimeoutId !== null) {
            window.clearTimeout(fullscreenDockTimeoutId);
            fullscreenDockTimeoutId = null;
        }
    }

    function scheduleFullscreenDockHide() {
        clearFullscreenDockTimeout();
        fullscreenDockTimeoutId = window.setTimeout(() => {
            if (!addMenuOpen && !settingsOpen) {
                fullscreenDockVisible = false;
            }
        }, FULLSCREEN_DOCK_HIDE_DELAY);
    }

    function handleFullscreenPointerMove(event: PointerEvent) {
        if (!fullscreenActive) return;

        const nearBottom = event.clientY > window.innerHeight - FULLSCREEN_DOCK_TRIGGER_ZONE;

        if (nearBottom) {
            fullscreenDockVisible = true;
            scheduleFullscreenDockHide();
        }
    }

    function handleFullscreenChange() {
        fullscreenActive = Boolean(document.fullscreenElement);

        if (!fullscreenActive) {
            fullscreenHintVisible = false;
            fullscreenDockVisible = false;
            clearFullscreenDockTimeout();
            return;
        }

        addMenuOpen = false;
        settingsOpen = false;
        fullscreenHintVisible = true;

        window.setTimeout(() => {
            if (document.fullscreenElement) {
                fullscreenHintVisible = false;
            }
        }, 2600);
    }

    function formatTimer(totalSeconds: number) {
        const safeSeconds = Math.max(0, totalSeconds);
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const seconds = safeSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }

        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function startDrag(event: PointerEvent, id: string) {
        if (!boardElement) return;

        const rect = boardElement.getBoundingClientRect();
        const widget = findWidget(id);
        if (!widget) return;

        dragState = {
            id,
            offsetX: event.clientX - rect.left - widget.x,
            offsetY: event.clientY - rect.top - widget.y,
        };
    }

    function startResize(event: PointerEvent, id: string) {
        const widget = findWidget(id);
        if (!widget) return;

        resizeState = {
            id,
            startX: event.clientX,
            startY: event.clientY,
            startW: widget.w,
            startH: widget.h,
        };
    }

    function snapValue(value: number) {
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    }

    function handlePointerMove(event: PointerEvent) {
        if (!boardElement) return;

        const rect = boardElement.getBoundingClientRect();

        if (dragState) {
            const widget = findWidget(dragState.id);
            if (!widget) return;

            const rawX = event.clientX - rect.left - dragState.offsetX;
            const rawY = event.clientY - rect.top - dragState.offsetY;
            const nextX = snapToGrid ? snapValue(rawX) : rawX;
            const nextY = snapToGrid ? snapValue(rawY) : rawY;

            widget.x = Math.max(0, Math.min(nextX, rect.width - widget.w));
            widget.y = Math.max(0, Math.min(nextY, rect.height - widget.h));
            widgets = [...widgets];
            return;
        }

        if (resizeState) {
            const widget = findWidget(resizeState.id);
            if (!widget) return;

            const deltaX = event.clientX - resizeState.startX;
            const deltaY = event.clientY - resizeState.startY;
            const constraints = widgetConstraints[widget.type];
            const maxW = rect.width - widget.x;
            const maxH = rect.height - widget.y;

            let nextW = resizeState.startW + deltaX;
            let nextH = resizeState.startH + deltaY;

            if (widget.type === "trelson") {
                const sectionCount = getTrelsonSectionCount(widget, true);
                const widthCandidate = resizeState.startW + deltaX;
                const heightCandidate = resizeState.startH + deltaY;
                const heightDrivenWidth = getTrelsonWidthFromHeight(
                    Math.max(constraints.minH, Math.min(heightCandidate, maxH)),
                    sectionCount,
                );

                nextW =
                    Math.abs(deltaY) > Math.abs(deltaX)
                        ? heightDrivenWidth
                        : widthCandidate;
                nextW = Math.max(constraints.minW, Math.min(nextW, maxW));

                if (snapToGrid) {
                    nextW = Math.max(
                        constraints.minW,
                        Math.min(snapValue(nextW), maxW),
                    );
                }

                const derivedHeight = getTrelsonHeight(nextW, sectionCount);

                widget.w = nextW;
                widget.h = Math.max(
                    constraints.minH,
                    Math.min(derivedHeight, maxH),
                );
                widgets = [...widgets];
                return;
            }

            if (constraints.autoWidth) {
                const aspectRatio = resizeState.startW / resizeState.startH;
                const heightDeltaFromWidth =
                    deltaX / Math.max(aspectRatio, 0.01);
                const dominantDelta =
                    Math.abs(heightDeltaFromWidth) > Math.abs(deltaY)
                        ? heightDeltaFromWidth
                        : deltaY;

                nextH = Math.max(
                    constraints.minH,
                    Math.min(resizeState.startH + dominantDelta, maxH),
                );
                nextW = Math.max(
                    constraints.minW,
                    Math.min(nextH * aspectRatio, maxW),
                );

                if (snapToGrid) {
                    nextH = Math.max(
                        constraints.minH,
                        Math.min(snapValue(nextH), maxH),
                    );
                    nextW = Math.max(
                        constraints.minW,
                        Math.min(nextH * aspectRatio, maxW),
                    );
                }

                widget.scaleH = nextH;
                widget.h =
                    widget.type === "text" ? Math.max(nextH, widget.h) : nextH;
                widget.w = nextW;
                widgets = [...widgets];
                return;
            }

            if (constraints.keepAspect && constraints.aspectRatio) {
                const widthDriven = Math.max(
                    constraints.minW,
                    Math.min(nextW, maxW),
                );
                const heightFromWidth = widthDriven / constraints.aspectRatio;
                const heightDriven = Math.max(
                    constraints.minH,
                    Math.min(nextH, maxH),
                );
                const widthFromHeight = heightDriven * constraints.aspectRatio;
                const widthChange = Math.abs(deltaX);
                const heightChange = Math.abs(deltaY);

                if (widthChange >= heightChange) {
                    nextW = widthDriven;
                    nextH = heightFromWidth;
                } else {
                    nextH = heightDriven;
                    nextW = widthFromHeight;
                }

                if (nextH > maxH) {
                    nextH = maxH;
                    nextW = nextH * constraints.aspectRatio;
                }

                if (nextW > maxW) {
                    nextW = maxW;
                    nextH = nextW / constraints.aspectRatio;
                }

                nextW = Math.max(constraints.minW, nextW);
                nextH = Math.max(constraints.minH, nextH);
            } else {
                nextW = Math.max(constraints.minW, Math.min(nextW, maxW));
                nextH = Math.max(constraints.minH, Math.min(nextH, maxH));
            }

            if (snapToGrid) {
                if (constraints.keepAspect && constraints.aspectRatio) {
                    nextW = Math.max(
                        constraints.minW,
                        Math.min(snapValue(nextW), maxW),
                    );
                    nextH = nextW / constraints.aspectRatio;

                    if (nextH > maxH) {
                        nextH = Math.max(
                            constraints.minH,
                            Math.min(snapValue(maxH), maxH),
                        );
                        nextW = nextH * constraints.aspectRatio;
                    }
                } else {
                    nextW = Math.max(
                        constraints.minW,
                        Math.min(snapValue(nextW), maxW),
                    );
                    nextH = Math.max(
                        constraints.minH,
                        Math.min(snapValue(nextH), maxH),
                    );
                }
            }

            widget.w = nextW;
            widget.h = nextH;
            widgets = [...widgets];
        }
    }

    function syncIntrinsicSize(
        id: string,
        size: { width: number; height: number },
    ) {
        const widget = findWidget(id);
        if (!widget || !boardElement) return;

        const constraints = widgetConstraints[widget.type];

        if (!constraints.autoWidth) return;

        const boardRect = boardElement.getBoundingClientRect();
        const maxW = boardRect.width - widget.x;
        const maxH = boardRect.height - widget.y;
        const nextW = Math.max(constraints.minW, Math.min(size.width, maxW));
        const nextH =
            widget.type === "text"
                ? Math.max(
                      widget.scaleH ?? constraints.minH,
                      Math.min(size.height, maxH),
                  )
                : (widget.scaleH ?? widget.h);

        if (Math.abs(widget.w - nextW) < 1 && Math.abs(widget.h - nextH) < 1) {
            return;
        }

        widget.w = nextW;
        widget.h = nextH;
        widgets = [...widgets];
    }

    function rescaleWidgetsForBoardSize(
        previousWidth: number,
        previousHeight: number,
        nextWidth: number,
        nextHeight: number,
    ) {
        if (
            widgets.length === 0 ||
            previousWidth <= 0 ||
            previousHeight <= 0 ||
            nextWidth <= 0 ||
            nextHeight <= 0
        ) {
            return;
        }

        const widthRatio = nextWidth / previousWidth;
        const heightRatio = nextHeight / previousHeight;

        if (
            Math.abs(widthRatio - 1) < 0.001 &&
            Math.abs(heightRatio - 1) < 0.001
        ) {
            return;
        }

        widgets = widgets.map((widget) => {
            const constraints = widgetConstraints[widget.type];
            const nextWidget = { ...widget };

            if (widget.type === "trelson") {
                let nextW = clamp(widget.w, constraints.minW, nextWidth);
                let nextH = getTrelsonHeight(
                    nextW,
                    getTrelsonSectionCount(
                        widget,
                        selectedWidgetId === widget.id,
                    ),
                );

                if (nextH > nextHeight) {
                    nextH = nextHeight;
                    nextW = Math.max(
                        constraints.minW,
                        Math.min(
                            getTrelsonWidthFromHeight(
                                nextH,
                                getTrelsonSectionCount(
                                    widget,
                                    selectedWidgetId === widget.id,
                                ),
                            ),
                            nextWidth,
                        ),
                    );
                    nextH = getTrelsonHeight(
                        nextW,
                        getTrelsonSectionCount(
                            widget,
                            selectedWidgetId === widget.id,
                        ),
                    );
                }

                nextWidget.w = nextW;
                nextWidget.h = nextH;
            } else if (constraints.autoWidth) {
                const nextScaleH = clamp(
                    widget.scaleH ?? widget.h,
                    constraints.minH,
                    nextHeight,
                );

                nextWidget.scaleH = nextScaleH;
                nextWidget.w = clamp(widget.w, constraints.minW, nextWidth);
                nextWidget.h =
                    widget.type === "text"
                        ? Math.max(nextScaleH, Math.min(widget.h, nextHeight))
                        : nextScaleH;
            } else if (constraints.keepAspect && constraints.aspectRatio) {
                const fitRatio = Math.min(
                    nextWidth / widget.w,
                    nextHeight / widget.h,
                    1,
                );
                let nextW = widget.w * fitRatio;
                let nextH = widget.h * fitRatio;

                nextWidget.w = Math.max(constraints.minW, nextW);
                nextWidget.h = Math.max(constraints.minH, nextH);
            } else {
                nextWidget.w = clamp(widget.w, constraints.minW, nextWidth);
                nextWidget.h = clamp(widget.h, constraints.minH, nextHeight);
            }

            nextWidget.x = clamp(
                widget.x * widthRatio,
                0,
                Math.max(0, nextWidth - nextWidget.w),
            );
            nextWidget.y = clamp(
                widget.y * heightRatio,
                0,
                Math.max(0, nextHeight - nextWidget.h),
            );

            return nextWidget;
        });
    }

    function syncBoardSizeAndLayout() {
        if (!boardElement) return;

        const rect = boardElement.getBoundingClientRect();
        const nextBoardSize = {
            width: rect.width,
            height: rect.height,
        };
        const previousBoardSize = lastBoardSize;

        lastBoardSize = nextBoardSize;

        if (!previousBoardSize || dragState || resizeState) {
            return;
        }

        rescaleWidgetsForBoardSize(
            previousBoardSize.width,
            previousBoardSize.height,
            nextBoardSize.width,
            nextBoardSize.height,
        );
    }

    function stopDrag() {
        dragState = null;
        resizeState = null;
    }

    function clearSelection() {
        if (dragState || resizeState) return;
        if (selectedWidgetId) {
            syncTrelsonHeight(selectedWidgetId, false);
        }
        selectedWidgetId = null;
        addMenuOpen = false;
        settingsOpen = false;
    }

    function duplicateWidget(id: string) {
        const source = findWidget(id);
        if (!source) return;

        const offset = 20;
        const newId = nextWidgetId(source.type);
        const clone: WidgetInstance = {
            ...JSON.parse(JSON.stringify(source)),
            id: newId,
            x: source.x + offset,
            y: source.y + offset,
            z: getTopZ() + 1,
        };

        widgets = [...widgets, clone];
        defaultLayout = false;
        selectedWidgetId = newId;
    }

    function isEditableTarget(event: KeyboardEvent) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return false;
        if (target.closest('[contenteditable="true"]')) return true;
        if (target.closest('input, textarea, select')) return true;
        return false;
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (isEditableTarget(event)) return;

        const mod = event.metaKey || event.ctrlKey;

        if ((event.key === 'Backspace' || event.key === 'Delete') && selectedWidgetId) {
            event.preventDefault();
            removeWidget(selectedWidgetId);
            return;
        }

        if (event.key === 'Escape') {
            if (addMenuOpen || settingsOpen) {
                closeMenus();
            } else if (selectedWidgetId) {
                selectedWidgetId = null;
            }
            return;
        }

        if (mod && event.code === 'KeyD' && selectedWidgetId) {
            event.preventDefault();
            duplicateWidget(selectedWidgetId);
            return;
        }

        if (event.key === 'f' && !mod) {
            event.preventDefault();
            toggleFullscreen();
            return;
        }
    }

    onMount(() => {
        let boardResizeObserver: ResizeObserver | null = null;

        if (boardElement) {
            const rect = boardElement.getBoundingClientRect();
            const persistedState = loadPersistedBoardState(
                rect.width,
                rect.height,
            );

            if (persistedState) {
                theme = persistedState.theme;
                showGrid =
                    persistedState.board.showGrid || persistedState.board.snapToGrid;
                snapToGrid = persistedState.board.snapToGrid;
                defaultLayout = persistedState.board.defaultLayout;
                widgets = persistedState.widgets;
            } else {
                defaultLayout = true;
                widgets = createInitialWidgets(rect.width, rect.height);
            }

            setWidgetIdCounterFromWidgets(widgets);
            refreshBoardLibrary();
            lastBoardSize = {
                width: rect.width,
                height: rect.height,
            };
            boardResizeObserver = new ResizeObserver(() => {
                syncBoardSizeAndLayout();
            });
            boardResizeObserver.observe(boardElement);
        }

        storageReady = true;

        const handlePageHide = () => {
            flushPersistedBoardState();
        };

        const interval = window.setInterval(() => {
            now = new Date();
            let didTick = false;

            for (const widget of widgets) {
                if (
                    widget.type === "timer" &&
                    widget.timerRunning &&
                    (widget.timerRemaining ?? 0) > 0
                ) {
                    widget.timerRemaining = Math.max(
                        0,
                        (widget.timerRemaining ?? 0) - 1,
                    );

                    if (widget.timerRemaining === 0) {
                        widget.timerRunning = false;
                    }

                    didTick = true;
                }

                if (
                    widget.type === "lessonTimer" &&
                    widget.lessonTimerRunning &&
                    (widget.lessonTimerRemaining ?? 0) > 0
                ) {
                    widget.lessonTimerRemaining = Math.max(
                        0,
                        (widget.lessonTimerRemaining ?? 0) - 1,
                    );

                    if (widget.lessonTimerRemaining === 0) {
                        widget.lessonTimerRunning = false;
                    }

                    didTick = true;
                }
            }

            if (didTick) {
                widgets = [...widgets];
            }
        }, 1000);

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointermove", handleFullscreenPointerMove);
        window.addEventListener("pointerup", stopDrag);
        window.addEventListener("keydown", handleKeyDown, { capture: true });
        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("beforeunload", handlePageHide);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            flushPersistedBoardState();
            window.clearInterval(interval);
            clearFullscreenDockTimeout();
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointermove", handleFullscreenPointerMove);
            window.removeEventListener("pointerup", stopDrag);
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("beforeunload", handlePageHide);
            document.removeEventListener(
                "fullscreenchange",
                handleFullscreenChange,
            );
            boardResizeObserver?.disconnect();
        };
    });
</script>

<svelte:head>
    <title>{themeConfig.pageTitle}</title>
    <meta name="description" content={themeConfig.metaDescription} />
</svelte:head>

<div class="screen-shell" data-theme={theme}>
    {#if !fullscreenActive || fullscreenDockVisible}
        <div
            class="dock-wrapper"
            class:dock-wrapper--fullscreen={fullscreenActive}
            onpointerenter={() => { if (fullscreenActive) clearFullscreenDockTimeout(); }}
            onpointerleave={() => { if (fullscreenActive) scheduleFullscreenDockHide(); }}
        >
            <FloatingControls
                {theme}
                {addMenuOpen}
                {settingsOpen}
                {fullscreenActive}
                onToggleAddMenu={toggleAddMenu}
                onToggleSettings={toggleSettings}
                onToggleFullscreen={toggleFullscreen}
                onToggleTheme={toggleTheme}
            />
            {#if addMenuOpen || settingsOpen}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div class="menu-backdrop" onpointerdown={closeMenus}></div>
            {/if}
            <AddWidgetMenu open={addMenuOpen} entries={widgetMenuEntries} />
            <SettingsPanel
                open={settingsOpen}
                {theme}
                {showGrid}
                {snapToGrid}
                libraryItems={boardLibraryItems}
                onExportBoard={exportBoard}
                onImportBoard={importBoard}
                onSaveScreen={() => saveCurrentBoard("screen")}
                onSaveTemplate={() => saveCurrentBoard("template")}
                onLoadLibraryItem={loadBoardFromLibrary}
                onDeleteLibraryItem={removeBoardFromLibrary}
                onResetBoard={resetBoard}
                onToggleTheme={toggleTheme}
                onToggleShowGrid={toggleShowGrid}
                onToggleSnapToGrid={toggleSnapToGrid}
            />
        </div>
    {/if}

    {#if fullscreenHintVisible}
        <div class="fullscreen-hint" role="status" aria-live="polite">
            Verktyg visas längst ner ↓
        </div>
    {/if}

    <main class="screen">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <section
            class:grid-visible={showGrid}
            class="board"
            bind:this={boardElement}
            onpointerdown={clearSelection}
        >
            {#if showBoardGuide}
                <div class="empty-state">
                    <p class="empty-state-text">Lägg till widgets med knappen nedan</p>
                    <span class="empty-state-arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                    </span>
                </div>
            {/if}

            {#each orderedWidgets as widget (widget.id)}
                {#if widget.type === "logo"}
                    <LogoWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        src={activeLogo}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "date"}
                    <DateWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        scaleHeight={widget.scaleH ?? widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        value={currentDate}
                        onMeasure={(size) => syncIntrinsicSize(widget.id, size)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "digital"}
                    <DigitalClockWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        scaleHeight={widget.scaleH ?? widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        time={digitalTime}
                        onMeasure={(size) => syncIntrinsicSize(widget.id, size)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "lcd"}
                    <LcdClockWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        time={digitalTime}
                        seconds={now.getSeconds()}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "text"}
                    <TextWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        scaleHeight={widget.scaleH ?? widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        isDark={theme === "dark"}
                        value={widget.textValue ?? "Skriv rubrik"}
                        font={widget.textFont ??
                            themeConfig.textWidget.defaultFont}
                        background={widget.textBackground ??
                            themeConfig.textWidget.defaultBackground}
                        color={widget.textColor ??
                            themeConfig.textWidget.defaultColor}
                        fontLabels={themeConfig.textWidget.fontLabels}
                        backgroundLabels={themeConfig.textWidget
                            .backgroundLabels}
                        colorLabels={themeConfig.textWidget.colorLabels}
                        onMeasure={(size) => syncIntrinsicSize(widget.id, size)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                        onToggleFont={() => toggleTextWidgetFont(widget.id)}
                        onBackgroundSelect={(background) =>
                            setTextWidgetBackground(widget.id, background)}
                        onColorSelect={(color) =>
                            setTextWidgetColor(widget.id, color)}
                        onValueChange={(value) =>
                            updateTextWidgetValue(widget.id, value)}
                    />
                {:else if widget.type === "analog"}
                    <AnalogClockWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        {hourAngle}
                        {minuteAngle}
                        {secondAngle}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "lessonTimer"}
                    <LessonTimerWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        durationMinutes={widget.lessonTimerDurationMinutes ??
                            60}
                        remainingSeconds={widget.lessonTimerRemaining ??
                            60 * 60}
                        running={widget.lessonTimerRunning ?? false}
                        onDurationChange={(minutes) =>
                            setLessonTimerDuration(widget.id, minutes)}
                        onToggle={() => toggleLessonTimer(widget.id)}
                        onReset={() => resetLessonTimer(widget.id)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "timer"}
                    <TimerWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        seconds={widget.timerRemaining ?? 15 * 60}
                        label={formatTimer(widget.timerRemaining ?? 15 * 60)}
                        progress={(widget.timerDuration ?? 0) > 0
                            ? (widget.timerRemaining ?? 0) /
                              (widget.timerDuration ?? 1)
                            : 0}
                        running={widget.timerRunning ?? false}
                        onSetSeconds={(seconds) =>
                            setDigitalTimerSeconds(widget.id, seconds)}
                        onToggle={() => toggleTimer(widget.id)}
                        onReset={() => resetTimer(widget.id)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "bodyText"}
                    <BodyTextWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        resizing={resizeState?.id === widget.id}
                        isDark={theme === "dark"}
                        value={widget.textValue ?? "Skriv instruktioner här..."}
                        font={widget.bodyTextFont ??
                            themeConfig.bodyText.defaultFont}
                        background={widget.textBackground ??
                            themeConfig.textWidget.defaultBackground}
                        color={widget.textColor ??
                            themeConfig.textWidget.defaultColor}
                        fontLabels={themeConfig.bodyText.fontLabels}
                        fontFamilies={themeConfig.bodyText.fontFamilies}
                        backgroundLabels={themeConfig.textWidget
                            .backgroundLabels}
                        colorLabels={themeConfig.textWidget.colorLabels}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                        onValueChange={(value) =>
                            updateTextWidgetValue(widget.id, value)}
                        onBackgroundSelect={(background) =>
                            setBodyTextWidgetBackground(widget.id, background)}
                        onColorSelect={(color) =>
                            setBodyTextWidgetColor(widget.id, color)}
                    />
                {:else if widget.type === "stopwatch"}
                    <StopwatchWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        startTime={widget.stopwatchStartTime ?? null}
                        accumulated={widget.stopwatchAccumulated ?? 0}
                        running={widget.stopwatchRunning ?? false}
                        laps={widget.stopwatchLaps ?? []}
                        onToggle={() => toggleStopwatch(widget.id)}
                        onReset={() => resetStopwatch(widget.id)}
                        onLap={() => lapStopwatch(widget.id)}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                    />
                {:else if widget.type === "qrcode"}
                    <QrCodeWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        value={widget.qrValue ?? ""}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                        onValueChange={(value) =>
                            updateQrValue(widget.id, value)}
                    />
                {:else if widget.type === "trelson"}
                    <TrelsonWidget
                        x={widget.x}
                        y={widget.y}
                        w={widget.w}
                        h={widget.h}
                        z={widget.z}
                        selected={selectedWidgetId === widget.id}
                        pins={widget.trelsonPins ?? defaultTrelsonPins}
                        onSelect={() => selectWidget(widget.id)}
                        onMoveStart={(event) => startDrag(event, widget.id)}
                        onResizeStart={(event) => startResize(event, widget.id)}
                        onBringForward={() =>
                            moveWidgetLayer(widget.id, "forward")}
                        onSendBackward={() =>
                            moveWidgetLayer(widget.id, "backward")}
                        onDelete={() => removeWidget(widget.id)}
                        onPinChange={(field, value) =>
                            updateTrelsonPin(widget.id, field, value)}
                    />
                {/if}
            {/each}
        </section>
    </main>
</div>

<style>
    .screen-shell {
        position: relative;
        width: 100%;
        height: 100svh;
        overflow: hidden;
        background: var(--bg-bottom);
        color: var(--text);
    }

    .screen-shell::after {
        content: "";
        position: absolute;
        inset: 0;
        background:
            radial-gradient(
                ellipse 80% 60% at 15% 85%,
                color-mix(in srgb, var(--brand-primary-300) 16%, transparent),
                transparent 70%
            ),
            radial-gradient(
                ellipse 60% 50% at 85% 20%,
                color-mix(in srgb, var(--brand-warm-300) 10%, transparent),
                transparent 70%
            );
        pointer-events: none;
        z-index: 0;
    }

    .fullscreen-hint {
        position: fixed;
        left: 50%;
        bottom: 4.5rem;
        z-index: 22;
        transform: translateX(-50%);
        padding: 0.6rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.65rem;
        background: var(--hint-surface);
        color: var(--text);
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        box-shadow: var(--shadow);
        pointer-events: none;
    }

    .screen {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        padding: 0;
        box-sizing: border-box;
        overflow: hidden;
    }

    .board {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .board.grid-visible::before {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background-image:
            linear-gradient(
                to right,
                transparent calc(50% - 1px),
                color-mix(in srgb, var(--text) 22%, transparent) calc(50% - 1px),
                color-mix(in srgb, var(--text) 22%, transparent) calc(50% + 1px),
                transparent calc(50% + 1px)
            ),
            linear-gradient(
                to bottom,
                transparent calc(50% - 1px),
                color-mix(in srgb, var(--text) 22%, transparent) calc(50% - 1px),
                color-mix(in srgb, var(--text) 22%, transparent) calc(50% + 1px),
                transparent calc(50% + 1px)
            ),
            linear-gradient(
                to right,
                color-mix(in srgb, var(--text) 8%, transparent) 1px,
                transparent 1px
            ),
            linear-gradient(
                to bottom,
                color-mix(in srgb, var(--text) 8%, transparent) 1px,
                transparent 1px
            );
        background-size:
            100% 100%,
            100% 100%,
            16px 16px,
            16px 16px;
        opacity: 0.55;
    }

    .dock-wrapper {
        display: contents;
    }

    .menu-backdrop {
        position: fixed;
        inset: 0;
        z-index: 18;
    }

    .dock-wrapper--fullscreen {
        display: block;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 18;
        pointer-events: none;
        animation: dock-fade-in 220ms ease both;
    }

    .dock-wrapper--fullscreen :global(*) {
        pointer-events: auto;
    }

    @keyframes dock-fade-in {
        from {
            opacity: 0;
            transform: translateY(0.5rem);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .empty-state {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding-top: 12vh;
        pointer-events: none;
    }

    .empty-state-text {
        margin: 0;
        font-weight: 700;
        font-size: 1.1rem;
        letter-spacing: 0.02em;
        color: color-mix(in srgb, var(--text) 38%, transparent);
    }

    .empty-state-arrow {
        display: block;
        width: 1.6rem;
        height: 1.6rem;
        color: color-mix(in srgb, var(--text) 28%, transparent);
        animation: empty-bounce 2s ease-in-out infinite;
    }

    @keyframes empty-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(0.4rem); }
    }
</style>
