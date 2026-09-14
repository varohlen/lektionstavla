import { expect, test } from "vite-plus/test";
import { groupByWeek, isoWeek, parseCourses, parseCsv, parsePlan, type Lesson } from "./plan";

const HEADER = "Klass,Datum,Rubrik,Sidor,Uppgifter,Övrigt,Tid (min),Inställd / orsak,Material/länk";

const lesson = (date: string, title: string, cancelled = ""): Lesson => ({
  date,
  title,
  pages: "",
  tasks: "",
  notes: [],
  minutes: 50,
  cancelled,
});

test("parses quoted fields with commas, newlines and escaped quotes", () => {
  const csv = 'a,"b, c","line 1\nline 2","say ""hi"""\r\nd,e,f,g';

  expect(parseCsv(csv)).toEqual([
    ["a", "b, c", "line 1\nline 2", 'say "hi"'],
    ["d", "e", "f", "g"],
  ]);
});

test("strips a leading byte order mark", () => {
  expect(parseCsv("﻿Klass,Datum")).toEqual([["Klass", "Datum"]]);
});

test("groups lessons by class and sorts them by date", () => {
  const plans = parsePlan(
    [
      HEADER,
      'NA26,2026-09-04,Potenser del 1,27–28,"1201, 1203",,60,,',
      'NA26,2026-08-27,Bråk,14,"1125 a) c), 1126",,50,,',
      "SA26a,2026-08-31,Bråk,14,1125,,60,,",
    ].join("\n"),
  );

  expect(Object.keys(plans)).toEqual(["NA26", "SA26a"]);
  expect(plans.NA26.map((l) => l.date)).toEqual(["2026-08-27", "2026-09-04"]);
  expect(plans.NA26[0]).toEqual({
    date: "2026-08-27",
    title: "Bråk",
    pages: "14",
    tasks: "1125 a) c), 1126",
    notes: [],
    minutes: 50,
    cancelled: "",
  });
});

test("keeps cancelled lessons with their reason and skips rows without a date, title or reason", () => {
  const plans = parsePlan(
    [
      HEADER,
      "NA26,2026-08-19,Uppstartsdagar,,,,60,Uppstartsdagar,",
      "NA26,2026-09-03,,,,,50,Speeddating med politiker,",
      "NA26,,Utan datum,,,,50,,",
      "NA26,2026-09-22,,,,,50,,",
      "NA26,2026-09-21,Algebra,,,,50,,",
    ].join("\n"),
  );

  expect(plans.NA26.map((l) => [l.title, l.cancelled])).toEqual([
    ["Uppstartsdagar", "Uppstartsdagar"],
    ["Speeddating med politiker", "Speeddating med politiker"],
    ["Algebra", ""],
  ]);
});

test("normalises page ranges to an en dash", () => {
  const plans = parsePlan([HEADER, "NA26,2026-09-14,Repetition,45-56,,,50,,"].join("\n"));

  expect(plans.NA26[0].pages).toBe("45–56");
});

test("splits multi-line notes and appends material", () => {
  const plans = parsePlan(
    [HEADER, 'NA26,2026-09-14,Repetition,,,"Checkpoint: uZTbRx\nÖvningsprov: fqTC5n\n",50,,"Dator, KM"'].join(
      "\n",
    ),
  );

  expect(plans.NA26[0].notes).toEqual(["Checkpoint: uZTbRx", "Övningsprov: fqTC5n", "Dator, KM"]);
});

test("treats a missing or invalid duration as null", () => {
  const plans = parsePlan([HEADER, "NA26,2026-09-21,Algebra,,,,,,"].join("\n"));

  expect(plans.NA26[0].minutes).toBeNull();
});

test("reads the first course name per class from the optional Kurs column", () => {
  const csv = [
    "Klass,Datum,Rubrik,Kurs",
    "NA26,2026-09-21,Algebra,Matematik 1c",
    "SA26a,2026-09-21,Algebra,",
    "SA26a,2026-09-22,Bråk,Matematik 1b",
  ].join("\n");

  expect(parseCourses(csv)).toEqual({ NA26: "Matematik 1c", SA26a: "Matematik 1b" });
  expect(parseCourses("Klass,Datum,Rubrik\nNA26,2026-09-21,Algebra")).toEqual({});
});

test("throws when a required column is missing", () => {
  expect(() => parsePlan("Klass,Datum\nNA26,2026-09-21")).toThrow("Rubrik");
});

test("computes ISO week numbers across year boundaries", () => {
  expect(isoWeek("2026-08-19")).toEqual({ year: 2026, week: 34 });
  expect(isoWeek("2026-12-31")).toEqual({ year: 2026, week: 53 });
  expect(isoWeek("2027-01-01")).toEqual({ year: 2026, week: 53 });
  expect(isoWeek("2027-01-04")).toEqual({ year: 2027, week: 1 });
});

test("groups by ISO week and merges consecutive cancellations into one break", () => {
  const weeks = groupByWeek([
    lesson("2026-12-17", "Algebra"),
    lesson("2026-12-18", "Jullov", "Jullov"),
    lesson("2026-12-21", "Jullov", "Jullov"),
    lesson("2027-01-08", "Jullov", "Jullov"),
    lesson("2027-01-11", "Ekvationer"),
  ]);

  expect(weeks.map((w) => w.week)).toEqual([51, 2]);
  expect(weeks[0].entries).toMatchObject([
    { kind: "lesson", lesson: { title: "Algebra" } },
    { kind: "break", reason: "Jullov", from: "2026-12-18", to: "2027-01-08" },
  ]);
  expect(weeks[1].entries).toMatchObject([{ kind: "lesson", lesson: { title: "Ekvationer" } }]);
});
