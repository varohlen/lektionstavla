import { coreConfig } from "./core";
import { overrides } from "./default";

function mergeConfig() {
  const widgets = Object.fromEntries(
    (
      Object.entries(coreConfig.widgets) as [
        keyof typeof coreConfig.widgets,
        (typeof coreConfig.widgets)[keyof typeof coreConfig.widgets],
      ][]
    ).map(([type, widget]) => {
      const widgetOverride = overrides.widgets?.[type];

      return [
        type,
        {
          ...widget,
          ...widgetOverride,
          readiness: {
            ...widget.readiness,
            ...widgetOverride?.readiness,
          },
          defaultLayout: {
            ...widget.defaultLayout,
            ...widgetOverride?.defaultLayout,
          },
          initialState:
            widget.initialState || widgetOverride?.initialState
              ? {
                  ...widget.initialState,
                  ...widgetOverride?.initialState,
                }
              : undefined,
        },
      ];
    }),
  ) as typeof coreConfig.widgets;

  return {
    widgets,
    initialBoard: {
      widgets: overrides.initialBoard?.widgets ?? coreConfig.initialBoard.widgets,
    },
  };
}

const config = mergeConfig();

export { config, coreConfig, overrides };
export type {
  AppVariantConfig,
  AppVariantOverrides,
  VariantWidgetConfig,
  VariantWidgetOverride,
  WidgetDefaultLayout,
  WidgetReadiness,
  WidgetType,
} from "./types";
