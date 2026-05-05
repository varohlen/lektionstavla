// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module "lucide-svelte/icons/moon.js" {
  import type { Component } from "svelte";
  const Moon: Component;
  export default Moon;
}

declare module "lucide-svelte/icons/sun-medium.js" {
  import type { Component } from "svelte";
  const SunMedium: Component;
  export default SunMedium;
}

export {};
