/**
 * Geometry for the Trelson widget.
 *
 * The board derives the widget's height from these values while the widget
 * renders from them, so they must stay in one place to avoid the two drifting
 * apart.
 */
export const TRELSON_EDIT_SECTION_COUNT = 5;
export const TRELSON_SECTION_SCALE = 0.155;
export const TRELSON_SECTION_GAP_FACTOR = 0.18;
export const TRELSON_MIN_SECTION_HEIGHT = 44;

export function getTrelsonSectionHeight(width: number) {
  return Math.max(TRELSON_MIN_SECTION_HEIGHT, width * TRELSON_SECTION_SCALE);
}

export function getTrelsonSectionGap(sectionHeight: number) {
  return sectionHeight * TRELSON_SECTION_GAP_FACTOR;
}

export function getTrelsonHeight(width: number, sectionCount: number) {
  const sectionHeight = getTrelsonSectionHeight(width);
  const sectionGap = getTrelsonSectionGap(sectionHeight);

  return Math.round(sectionHeight * sectionCount + sectionGap * (sectionCount - 1));
}

export function getTrelsonWidthFromHeight(height: number, sectionCount: number) {
  const sectionUnit =
    TRELSON_SECTION_SCALE * (sectionCount + TRELSON_SECTION_GAP_FACTOR * (sectionCount - 1));

  return height / sectionUnit;
}
