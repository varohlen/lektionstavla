import { error } from "@sveltejs/kit";
import { loadClassPlans } from "$lib/mattevy/source.server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ fetch, setHeaders }) => {
  const classes = await loadClassPlans(fetch);
  if (classes.length === 0) error(404, "Planeringen innehåller inga klasser.");

  // Google caches the published sheet for ~5 minutes, so matching that is enough.
  setHeaders({ "cache-control": "public, max-age=300" });

  return { classes };
};
