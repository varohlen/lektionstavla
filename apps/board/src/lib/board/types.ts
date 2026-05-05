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
  lessonTimerDurationMinutes?: number;
  lessonTimerRemaining?: number;
  lessonTimerRunning?: boolean;
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

export type BoardLibraryItemKind = "screen" | "template";

export type BoardLibraryItemV1 = {
  id: string;
  name: string;
  kind: BoardLibraryItemKind;
  updatedAt: string;
  board: PortableBoardDocumentV1;
};
