import path from "node:path";
import adapter from "@sveltejs/adapter-cloudflare";

const theme = process.env.THEME ?? "default";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      $theme: path.resolve("src/themes", theme),
    },
  },
  vitePlugin: {
    dynamicCompileOptions: ({ filename }) =>
      filename.includes("node_modules") ? undefined : { runes: true },
  },
};

export default config;
