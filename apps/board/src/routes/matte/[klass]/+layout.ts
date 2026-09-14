import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params, parent }) => {
  const { classes } = await parent();
  const plan = classes.find((c) => c.id === params.klass.toLowerCase());
  if (!plan) error(404, `Klassen ${params.klass} finns inte i planeringen.`);

  return { plan };
};
