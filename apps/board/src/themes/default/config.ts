import logoLight from "./logo-light.svg";
import logoDark from "./logo-dark.svg";
import type { ThemeConfig } from "$lib/theme/types";

export const config = {
  schoolName: "Lektionstavla",
  pageTitle: "Lektionstavla",
  metaDescription: "Lektionstavla är en widgetbaserad klassrumsskärm.",
  logos: {
    light: logoLight,
    dark: logoDark,
    aspectRatio: 1920 / 300,
  },
  textWidget: {
    defaultFont: "body",
    defaultBackground: "none",
    defaultColor: "default",
    fontLabels: {
      body: "Inter",
      display: "League Spartan",
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
      default: "Auto",
      inverse: "Motsatt",
      primary: "Primär",
      warm: "Varm",
      success: "Grön",
      danger: "Röd",
    },
  },
  bodyText: {
    defaultFont: "sans",
    fontLabels: {
      sans: "Sans (Inter)",
      display: "Display (League Spartan)",
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
