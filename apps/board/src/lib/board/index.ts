import type { WidgetType } from "../variant";
import type {
  BoardThemeMode,
  PersistedBoardStateV1,
  PortableBoardDocumentV1,
  WidgetInstance,
} from "./types";

export type {
  BoardLibraryItemKind,
  BoardLibraryItemV1,
  BoardThemeMode,
  PersistedBoardStateV1,
  PortableBoardDocumentV1,
  TrelsonPins,
  WidgetInstance,
} from "./types";

export {
  deleteBoardLibraryItem,
  getBoardLibraryItem,
  listBoardLibraryItems,
  saveBoardLibraryItem,
} from "./library";

export function cloneWidgetInstance(widget: WidgetInstance): WidgetInstance {
  return {
    ...widget,
    stopwatchLaps: widget.stopwatchLaps ? [...widget.stopwatchLaps] : undefined,
    trelsonPins: widget.trelsonPins ? { ...widget.trelsonPins } : undefined,
  };
}

export function cloneWidgetInstances(widgets: WidgetInstance[]): WidgetInstance[] {
  return widgets.map(cloneWidgetInstance);
}

export function createPortableBoardDocument(input: {
  theme: BoardThemeMode;
  showGrid: boolean;
  snapToGrid: boolean;
  defaultLayout: boolean;
  widgets: WidgetInstance[];
  meta?: PortableBoardDocumentV1["meta"];
}): PortableBoardDocumentV1 {
  return {
    version: 1,
    board: {
      darkMode: input.theme === "dark",
      showGrid: input.showGrid,
      snapToGrid: input.snapToGrid,
      defaultLayout: input.defaultLayout,
    },
    widgets: cloneWidgetInstances(input.widgets),
    meta: input.meta,
  };
}

export function createPersistedBoardState(input: {
  theme: BoardThemeMode;
  showGrid: boolean;
  snapToGrid: boolean;
  defaultLayout: boolean;
  widgets: WidgetInstance[];
}): PersistedBoardStateV1 {
  return {
    theme: input.theme,
    ...createPortableBoardDocument(input),
  };
}

export function isPortableBoardDocumentV1(value: unknown): value is PortableBoardDocumentV1 {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PortableBoardDocumentV1>;

  return (
    candidate.version === 1 &&
    !!candidate.board &&
    typeof candidate.board === "object" &&
    Array.isArray(candidate.widgets)
  );
}

export function getMissingWidgetTypes(
  document: PortableBoardDocumentV1,
  enabledWidgetTypes: WidgetType[],
): WidgetType[] {
  const enabled = new Set(enabledWidgetTypes);

  return [...new Set(document.widgets.map((widget) => widget.type))].filter(
    (type) => !enabled.has(type),
  );
}
