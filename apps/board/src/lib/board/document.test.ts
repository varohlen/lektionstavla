import { expect, test } from "vite-plus/test";
import {
  cloneWidgetInstance,
  createPersistedBoardState,
  createPortableBoardDocument,
  getMissingWidgetTypes,
  isPortableBoardDocumentV1,
} from "./index";
import type { WidgetInstance } from "./types";

function makeWidget(overrides: Partial<WidgetInstance> = {}): WidgetInstance {
  return {
    id: "digital-1",
    type: "digital",
    x: 10,
    y: 20,
    w: 300,
    h: 100,
    z: 1,
    ...overrides,
  };
}

test("clone does not share nested arrays or objects", () => {
  const source = makeWidget({
    type: "stopwatch",
    stopwatchLaps: [1000, 2000],
    trelsonPins: { start: "1", resume: "2", submit: "3", close: "4" },
  });

  const clone = cloneWidgetInstance(source);
  clone.stopwatchLaps?.push(3000);
  clone.trelsonPins!.start = "9";

  expect(source.stopwatchLaps).toEqual([1000, 2000]);
  expect(source.trelsonPins?.start).toBe("1");
});

test("portable document carries board settings and copies widgets", () => {
  const widget = makeWidget();
  const document = createPortableBoardDocument({
    theme: "dark",
    showGrid: true,
    snapToGrid: false,
    defaultLayout: false,
    widgets: [widget],
  });

  expect(document.version).toBe(1);
  expect(document.board).toEqual({
    darkMode: true,
    showGrid: true,
    snapToGrid: false,
    defaultLayout: false,
  });
  expect(document.widgets[0]).toEqual(widget);
  expect(document.widgets[0]).not.toBe(widget);
});

test("persisted state keeps the theme alongside the portable document", () => {
  const persisted = createPersistedBoardState({
    theme: "light",
    showGrid: false,
    snapToGrid: false,
    defaultLayout: true,
    widgets: [],
  });

  expect(persisted.theme).toBe("light");
  expect(persisted.board.darkMode).toBe(false);
  expect(isPortableBoardDocumentV1(persisted)).toBe(true);
});

test("rejects payloads that are not a v1 board document", () => {
  expect(isPortableBoardDocumentV1(null)).toBe(false);
  expect(isPortableBoardDocumentV1("nope")).toBe(false);
  expect(isPortableBoardDocumentV1({})).toBe(false);
  expect(isPortableBoardDocumentV1({ version: 2, board: {}, widgets: [] })).toBe(false);
  expect(isPortableBoardDocumentV1({ version: 1, widgets: [] })).toBe(false);
  expect(isPortableBoardDocumentV1({ version: 1, board: {}, widgets: {} })).toBe(false);
  expect(isPortableBoardDocumentV1({ version: 1, board: {}, widgets: [] })).toBe(true);
});

test("reports widget types the current variant cannot render", () => {
  const document = createPortableBoardDocument({
    theme: "light",
    showGrid: false,
    snapToGrid: false,
    defaultLayout: false,
    widgets: [
      makeWidget({ id: "digital-1", type: "digital" }),
      makeWidget({ id: "trelson-1", type: "trelson" }),
      makeWidget({ id: "trelson-2", type: "trelson" }),
    ],
  });

  expect(getMissingWidgetTypes(document, ["digital", "date"])).toEqual(["trelson"]);
  expect(getMissingWidgetTypes(document, ["digital", "trelson"])).toEqual([]);
});
