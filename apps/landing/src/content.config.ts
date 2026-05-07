import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const uppdateringar = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/uppdateringar" }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

export const collections = { uppdateringar };
