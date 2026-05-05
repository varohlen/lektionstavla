import logoLight from "./logo-light.svg";
import logoDark from "./logo-dark.svg";
import type { ThemeConfig } from "$lib/theme/types";

export const config = {
  schoolName: "Partille Gymnasium",
  pageTitle: "Lektionsvy | Partille Gymnasium",
  metaDescription: "Lektionsvy är en widgetbaserad classroom screen för Partille Gymnasium.",
  logos: {
    light: logoLight,
    dark: logoDark,
    aspectRatio: 387 / 91,
  },
  textWidget: {
    defaultFont: "body",
    defaultBackground: "none",
    defaultColor: "default",
    fontLabels: {
      body: "Myriad Pro",
      display: "Knewave",
    },
    backgroundLabels: {
      none: "Ingen",
      surface: "Yta",
      primary: "Primär",
      warm: "Varm",
      success: "Grön",
      danger: "Röd",
    },
    colorLabels: {
      default: "Standard",
      inverse: "Vit",
      primary: "Primär",
      warm: "Varm",
      success: "Grön",
      danger: "Röd",
    },
  },
  bodyText: {
    defaultFont: "sans",
    fontLabels: {
      sans: "Sans (Myriad Pro)",
      display: "Display (Knewave)",
      mono: "Mono (JetBrains Mono)",
    },
    fontFamilies: {
      sans: "var(--font-body)",
      display: "var(--font-display)",
      mono: "var(--font-mono)",
    },
  },
  features: {
    trelson: true,
  },
} satisfies ThemeConfig;
