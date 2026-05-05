export type WidgetType =
  | "logo"
  | "date"
  | "digital"
  | "lcd"
  | "text"
  | "bodyText"
  | "analog"
  | "lessonTimer"
  | "timer"
  | "stopwatch"
  | "qrcode"
  | "trelson";

export type WidgetReadiness = "ready" | "beta" | "prototype";

export type VariantTrelsonPins = {
  start: string;
  resume: string;
  submit: string;
  close: string;
};

export type WidgetDefaultLayout = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  scaleH?: number;
  z: number;
};

export type VariantWidgetConfig = {
  label: string;
  readiness: {
    status: WidgetReadiness;
    note?: string;
  };
  enabled: boolean;
  defaultLayout: WidgetDefaultLayout;
  initialState?: {
    textValue?: string;
    timerDuration?: number;
    lessonTimerDurationMinutes?: number;
    qrValue?: string;
    trelsonPins?: VariantTrelsonPins;
  };
};

export type AppVariantConfig = {
  widgets: Record<WidgetType, VariantWidgetConfig>;
  initialBoard: {
    widgets: WidgetType[];
  };
};

export type VariantWidgetOverride = {
  label?: string;
  readiness?: Partial<VariantWidgetConfig["readiness"]>;
  enabled?: boolean;
  defaultLayout?: Partial<WidgetDefaultLayout>;
  initialState?: Partial<NonNullable<VariantWidgetConfig["initialState"]>>;
};

export type AppVariantOverrides = {
  widgets?: Partial<Record<WidgetType, VariantWidgetOverride>>;
  initialBoard?: {
    widgets?: WidgetType[];
  };
};
