import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

// Keeps already shared links working: /matte/na26/planering -> matematik.nu/na26/planering
export const GET: RequestHandler = ({ params, url }) => {
  redirect(301, `https://matematik.nu/${params.rest}${url.search}`);
};
