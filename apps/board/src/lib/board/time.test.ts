import { expect, test } from "vite-plus/test";
import { formatTimer, getRemainingSeconds } from "./time";

test("counts down from an absolute deadline", () => {
  const now = 1_000_000;

  expect(getRemainingSeconds(now + 60_000, 0, now)).toBe(60);
  expect(getRemainingSeconds(now + 30_500, 0, now)).toBe(31);
  expect(getRemainingSeconds(now, 0, now)).toBe(0);
});

test("never returns a negative remainder for an expired deadline", () => {
  const now = 1_000_000;

  expect(getRemainingSeconds(now - 90_000, 0, now)).toBe(0);
});

test("stays accurate when ticks are skipped", () => {
  const start = 1_000_000;
  const endsAt = start + 45 * 60 * 1000;

  // A throttled tab may not tick for minutes; the deadline still decides.
  expect(getRemainingSeconds(endsAt, 45 * 60, start + 10 * 60 * 1000)).toBe(35 * 60);
  expect(getRemainingSeconds(endsAt, 45 * 60, start + 44 * 60 * 1000)).toBe(60);
});

test("falls back to the frozen value when paused", () => {
  expect(getRemainingSeconds(null, 125)).toBe(125);
  expect(getRemainingSeconds(undefined, 125)).toBe(125);
  expect(getRemainingSeconds(Number.NaN, 125)).toBe(125);
  expect(getRemainingSeconds(null, -5)).toBe(0);
});

test("formats below and above an hour", () => {
  expect(formatTimer(0)).toBe("00:00");
  expect(formatTimer(9)).toBe("00:09");
  expect(formatTimer(65)).toBe("01:05");
  expect(formatTimer(59 * 60 + 59)).toBe("59:59");
  expect(formatTimer(3600)).toBe("01:00:00");
  expect(formatTimer(3 * 3600 + 7 * 60 + 5)).toBe("03:07:05");
});

test("clamps negative input when formatting", () => {
  expect(formatTimer(-30)).toBe("00:00");
});
