import { config as themeConfig } from "../theme";
import type { WidgetType } from "../variant";

/**
 * Per-type presentation facts about widgets, kept in one place so adding a
 * widget does not mean hunting through the board page and the add menu.
 * Layout defaults, labels and readiness live in the variant config instead.
 */
export type WidgetConstraint = {
  minW: number;
  minH: number;
  keepAspect: boolean;
  aspectRatio?: number;
  autoWidth?: boolean;
};

export const WIDGET_CATEGORY_ORDER = ["Tid", "Timer", "Text", "Övrigt"] as const;

export type WidgetCategory = (typeof WIDGET_CATEGORY_ORDER)[number];

export const widgetConstraints: Record<WidgetType, WidgetConstraint> = {
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
  lessonTimer: { minW: 320, minH: 300, keepAspect: true, aspectRatio: 1.1 },
  timer: { minW: 320, minH: 170, keepAspect: true, aspectRatio: 2 },
  stopwatch: { minW: 340, minH: 140, keepAspect: true, aspectRatio: 2.5 },
  qrcode: { minW: 180, minH: 200, keepAspect: false },
  trelson: { minW: 220, minH: 120, keepAspect: false },
};

export const widgetCategories: Record<WidgetType, WidgetCategory> = {
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
