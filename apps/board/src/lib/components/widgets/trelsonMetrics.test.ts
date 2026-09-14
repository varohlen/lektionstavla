import { expect, test } from "vite-plus/test";
import {
  getTrelsonHeight,
  getTrelsonSectionHeight,
  getTrelsonWidthFromHeight,
  TRELSON_MIN_SECTION_HEIGHT,
} from "./trelsonMetrics";

test("section height never drops below the minimum", () => {
  expect(getTrelsonSectionHeight(0)).toBe(TRELSON_MIN_SECTION_HEIGHT);
  expect(getTrelsonSectionHeight(100)).toBe(TRELSON_MIN_SECTION_HEIGHT);
  expect(getTrelsonSectionHeight(400)).toBeCloseTo(62, 5);
});

test("height grows with both width and section count", () => {
  expect(getTrelsonHeight(400, 5)).toBeGreaterThan(getTrelsonHeight(400, 2));
  expect(getTrelsonHeight(600, 5)).toBeGreaterThan(getTrelsonHeight(400, 5));
});

test("width from height inverts height from width", () => {
  // Only holds above the minimum section height, where the clamp is inactive.
  // getTrelsonHeight rounds to whole pixels, so the round trip is accurate to
  // roughly a pixel rather than exact.
  for (const sectionCount of [2, 3, 5]) {
    for (const width of [400, 640, 900]) {
      const height = getTrelsonHeight(width, sectionCount);
      const roundTripped = getTrelsonWidthFromHeight(height, sectionCount);

      expect(Math.abs(roundTripped - width)).toBeLessThan(1);
    }
  }
});
