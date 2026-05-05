import type { AppVariantConfig } from "./types";

export const coreConfig: AppVariantConfig = {
  widgets: {
    logo: {
      label: "Logga",
      readiness: {
        status: "ready",
        note: "Visar skolans logotyp som fristående widget.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.01,
        y: 0.93,
        w: 0.15,
        z: 1,
      },
    },
    date: {
      label: "Datum",
      readiness: {
        status: "ready",
        note: "Datumrad som skalar efter innehållet.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.01,
        y: 0.105,
        scaleH: 0.03,
        z: 3,
      },
    },
    digital: {
      label: "Digital klocka",
      readiness: {
        status: "ready",
        note: "Stor digital klocka för klassrummet.",
      },
      enabled: true,
      defaultLayout: {
        x: 0,
        y: 0,
        scaleH: 0.1241,
        z: 2,
      },
    },
    lcd: {
      label: "LCD-klocka",
      readiness: {
        status: "ready",
        note: "Retro 7-segment LCD-display.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.35,
        y: 0.4,
        w: 0.3,
        z: 3,
      },
    },
    text: {
      label: "Rubrik",
      readiness: {
        status: "ready",
        note: "Stor skalande rubriktext för klassrummet.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.265,
        y: 0.3255,
        scaleH: 0.0755,
        z: 4,
      },
      initialState: {
        textValue: "Skriv rubrik",
      },
    },
    bodyText: {
      label: "Brödtext",
      readiness: {
        status: "ready",
        note: "Instruktioner, uppgifter och listor.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.35,
        y: 0.25,
        w: 0.3,
        h: 0.4,
        z: 5,
      },
      initialState: {
        textValue: "Skriv instruktioner här...",
      },
    },
    analog: {
      label: "Analog klocka",
      readiness: {
        status: "ready",
        note: "Klassisk analog klocka för klassrummet.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.0322,
        y: 0.0938,
        w: 0.205,
        z: 5,
      },
    },
    lessonTimer: {
      label: "Analog timer",
      readiness: {
        status: "ready",
        note: "Visuell analog nedräkning för lektionspass.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.5534,
        y: 0.1536,
        w: 0.3368,
        z: 6,
      },
      initialState: {
        lessonTimerDurationMinutes: 60,
      },
    },
    timer: {
      label: "Digital timer",
      readiness: {
        status: "ready",
        note: "Exakt digital timer med snabb redigering i widgeten.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.2665,
        y: 0.5026,
        w: 0.3075,
        z: 7,
      },
      initialState: {
        timerDuration: 15 * 60,
      },
    },
    stopwatch: {
      label: "Stoppur",
      readiness: {
        status: "ready",
        note: "Stoppur som räknar uppåt, med varvfunktion.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.3,
        y: 0.35,
        w: 0.35,
        h: 0.25,
        z: 8,
      },
    },
    qrcode: {
      label: "QR-kod",
      readiness: {
        status: "ready",
        note: "Visa QR-kod för valfri URL.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.4,
        y: 0.2,
        w: 0.2,
        h: 0.35,
        z: 8,
      },
      initialState: {
        qrValue: "",
      },
    },
    trelson: {
      label: "Trelson",
      readiness: {
        status: "ready",
        note: "PIN-widget för Trelson-flöden.",
      },
      enabled: true,
      defaultLayout: {
        x: 0.647,
        y: 0.13,
        w: 0.173,
        h: 0.34,
        z: 9,
      },
      initialState: {
        trelsonPins: {
          start: "",
          resume: "",
          submit: "",
          close: "",
        },
      },
    },
  },
  initialBoard: {
    widgets: ["logo", "date", "digital"],
  },
} satisfies AppVariantConfig;
