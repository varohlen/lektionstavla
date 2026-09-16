import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// The maths pages moved to their own project at matematik.nu.
export const GET: RequestHandler = ({ url }) => {
  redirect(301, `https://matematik.nu/${url.search}`);
};
