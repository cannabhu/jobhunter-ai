import { createBrowserClient } from "@insforge/sdk/ssr";

/** Browser-only InsForge client. Reads the SSR session; auth mutations run on the server. */
export const insforge = createBrowserClient();
