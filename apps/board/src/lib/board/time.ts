/**
 * Countdown helpers.
 *
 * Running countdowns are stored as an absolute deadline (`endsAt`) rather than
 * a decrementing counter, so they stay accurate across interval drift and
 * background-tab throttling. `fallbackSeconds` is the frozen value used while
 * the countdown is paused and no deadline exists.
 */
export function getRemainingSeconds(
  endsAt: number | null | undefined,
  fallbackSeconds: number,
  nowMs: number = Date.now(),
): number {
  if (typeof endsAt !== "number" || !Number.isFinite(endsAt)) {
    return Math.max(0, Math.floor(fallbackSeconds));
  }

  return Math.max(0, Math.ceil((endsAt - nowMs) / 1000));
}

export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}
