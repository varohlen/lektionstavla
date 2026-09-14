import { error } from "@sveltejs/kit";
import { parseCourses, parsePlan, type ClassPlan } from "./plan";

// Export view of the planning sheet, published to the web as CSV.
const PLAN_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzGXMg3XjV47DOjvi-UwsYYdHKa7o7PFr0j4DYuPKL5BNLxmvvrD23_iHZNqaqZv9jKKBmtgpIjZZq/pub?gid=190260913&single=true&output=csv";

/** Fetches the planning sheet and returns one plan per class, in sheet order. */
export async function loadClassPlans(fetch: typeof globalThis.fetch): Promise<ClassPlan[]> {
  const response = await fetch(PLAN_CSV_URL);
  if (!response.ok) error(502, "Planeringen kunde inte hämtas.");

  const csv = await response.text();
  const plans = parsePlan(csv);
  const courses = parseCourses(csv);

  return Object.entries(plans).map(([klass, lessons]) => ({
    id: klass.toLowerCase(),
    klass,
    course: courses[klass] ?? "",
    lessons,
  }));
}
