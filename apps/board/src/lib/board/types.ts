import type {
  BodyTextFontVariant,
  TextWidgetBackgroundVariant,
  TextWidgetColorVariant,
  TextWidgetFontVariant,
} from "../theme";
import type { WidgetType } from "../variant";

export type BoardThemeMode = "light" | "dark";

export type TrelsonPins = {
  start: string;
  resume: string;
  submit: string;
  close: string;
};

export type WidgetInstance = {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  scaleH?: number;
  z: number;
  textValue?: string;
  textFont?: TextWidgetFontVariant;
  bodyTextFont?: BodyTextFontVariant;
  textBackground?: TextWidgetBackgroundVariant;
  textColor?: TextWidgetColorVariant;
  timerDuration?: number;
  timerRemaining?: number;
  timerRunning?: boolean;
  /** Epoch ms the countdown reaches zero. Only set while running. */
  timerEndsAt?: number | null;
  lessonTimerDurationMinutes?: number;
  lessonTimerRemaining?: number;
  lessonTimerRunning?: boolean;
  /** Epoch ms the countdown reaches zero. Only set while running. */
  lessonTimerEndsAt?: number | null;
  stopwatchStartTime?: number | null;
  stopwatchAccumulated?: number;
  stopwatchRunning?: boolean;
  stopwatchLaps?: number[];
  qrValue?: string;
  trelsonPins?: TrelsonPins;
};

export type PortableBoardDocumentV1 = {
  version: 1;
  board: {
    darkMode?: boolean;
    showGrid: boolean;
    snapToGrid: boolean;
    defaultLayout: boolean;
  };
  widgets: WidgetInstance[];
  meta?: {
    name?: string;
    exportedAt?: string;
  };
};

export type PersistedBoardStateV1 = PortableBoardDocumentV1 & {
  theme: BoardThemeMode;
};

/**
 * Shape read back from localStorage. Older builds kept the board flags at the
 * top level instead of under `board`, so both placements are tolerated on read.
 */
export type StoredBoardStateV1 = Partial<PersistedBoardStateV1> & {
  showGrid?: boolean;
  snapToGrid?: boolean;
  defaultLayout?: boolean;
};

export type BoardLibraryItemKind = "screen" | "template";

export type BoardLibraryItemV1 = {
  id: string;
  name: string;
  kind: BoardLibraryItemKind;
  updatedAt: string;
  board: PortableBoardDocumentV1;
};
