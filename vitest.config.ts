import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    include: ["src/lib/hx/**/*.test.ts", "src/lib/v01d/**/*.test.ts", "src/lib/horsemen/**/*.test.ts", "src/lib/sentinel/**/*.test.ts", "src/lib/ghostwalk/**/*.test.ts", "src/lib/helix/**/*.test.ts", "src/lib/asimov/**/*.test.ts", "src/lib/hector/**/*.test.ts", "src/lib/forge/**/*.test.ts"],
  },
});
