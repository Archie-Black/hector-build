import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    include: ["src/lib/hx/**/*.test.ts", "src/lib/v01d/**/*.test.ts", "src/lib/horsemen/**/*.test.ts"],
  },
});
