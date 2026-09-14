export type Lesson = {
  date: string;
  title: string;
  pages: string;
  tasks: string;
  notes: string[];
  minutes: number | null;
  /** Why the lesson is not held (holiday, study day…); empty for a regular lesson. */
  cancelled: string;
};

export type ClassPlan = {
  /** URL segment, e.g. "na26". */
  id: string;
  klass: string;
  course: string;
  lessons: Lesson[];
};

export type PlanEntry =
  | { kind: "lesson"; key: string; lesson: Lesson }
  | { kind: "break"; key: string; reason: string; from: string; to: string };

export type PlanWeek = { key: string; week: number; entries: PlanEntry[] };

/** RFC 4180-style CSV: quoted fields may contain commas, newlines and "" escapes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

const COLUMNS = {
  klass: "Klass",
  date: "Datum",
  title: "Rubrik",
  pages: "Sidor",
  tasks: "Uppgifter",
  other: "Övrigt",
  minutes: "Tid (min)",
  cancelled: "Inställd / orsak",
  material: "Material/länk",
  course: "Kurs",
} as const;

const REQUIRED = [COLUMNS.klass, COLUMNS.date, COLUMNS.title];

/**
 * Turns the export sheet into lessons grouped by class, sorted by date.
 * Cancelled lessons are kept with their reason so the planning page can show them.
 */
export function parsePlan(csv: string): Record<string, Lesson[]> {
  const [header = [], ...rows] = parseCsv(csv);
  const index = new Map(header.map((name, i) => [name.trim(), i]));

  const missing = REQUIRED.filter((name) => !index.has(name));
  if (missing.length > 0) {
    throw new Error(`Planeringen saknar kolumner: ${missing.join(", ")}`);
  }

  const cell = (row: string[], name: string) => {
    const i = index.get(name);
    return i === undefined ? "" : (row[i] ?? "").trim();
  };

  const plans: Record<string, Lesson[]> = {};

  for (const row of rows) {
    const klass = cell(row, COLUMNS.klass);
    const date = cell(row, COLUMNS.date);
    const title = cell(row, COLUMNS.title);
    const cancelled = cell(row, COLUMNS.cancelled);

    if (!klass || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!title && !cancelled) continue;

    const notes = cell(row, COLUMNS.other)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const material = cell(row, COLUMNS.material);
    if (material) notes.push(material);

    const minutes = Number.parseInt(cell(row, COLUMNS.minutes), 10);

    (plans[klass] ??= []).push({
      date,
      title: title || cancelled,
      pages: cell(row, COLUMNS.pages).replace(/\s*[-–]\s*/g, "–"),
      tasks: cell(row, COLUMNS.tasks),
      notes,
      minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : null,
      cancelled,
    });
  }

  for (const lessons of Object.values(plans)) {
    lessons.sort((a, b) => a.date.localeCompare(b.date));
  }

  return plans;
}

/** First course name per class, from the optional "Kurs" column. */
export function parseCourses(csv: string): Record<string, string> {
  const [header = [], ...rows] = parseCsv(csv);
  const klassIndex = header.findIndex((name) => name.trim() === COLUMNS.klass);
  const courseIndex = header.findIndex((name) => name.trim() === COLUMNS.course);
  const courses: Record<string, string> = {};
  if (klassIndex < 0 || courseIndex < 0) return courses;

  for (const row of rows) {
    const klass = (row[klassIndex] ?? "").trim();
    const course = (row[courseIndex] ?? "").trim();
    if (klass && course && !courses[klass]) courses[klass] = course;
  }

  return courses;
}

/** ISO 8601 week number and week-year for a YYYY-MM-DD date. */
export function isoWeek(date: string): { year: number; week: number } {
  const day = new Date(`${date}T00:00:00Z`);
  // The Thursday of a week decides which year the week belongs to.
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7) + 3);
  const year = day.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((day.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return { year, week };
}

/** Groups lessons by ISO week and merges consecutive cancellations with the same reason into one break. */
export function groupByWeek(lessons: Lesson[]): PlanWeek[] {
  const weeks: PlanWeek[] = [];

  for (const [i, lesson] of lessons.entries()) {
    const previous = weeks.at(-1)?.entries.at(-1);
    if (lesson.cancelled && previous?.kind === "break" && previous.reason === lesson.cancelled) {
      previous.to = lesson.date;
      continue;
    }

    const { year, week } = isoWeek(lesson.date);
    const key = `${year}-${week}`;
    let current = weeks.at(-1);
    if (current?.key !== key) {
      current = { key, week, entries: [] };
      weeks.push(current);
    }

    const entryKey = `${lesson.date}-${i}`;
    current.entries.push(
      lesson.cancelled
        ? { kind: "break", key: entryKey, reason: lesson.cancelled, from: lesson.date, to: lesson.date }
        : { kind: "lesson", key: entryKey, lesson },
    );
  }

  return weeks;
}
