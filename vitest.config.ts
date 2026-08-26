import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: ["verbose"],
    projects: [
      {
        test: {
          name: { label: "unit", color: "green" },
          include: ["tests/*.unit.test.ts", "tests/*.unit.test.tsx"],
          environment: "node",
          clearMocks: true,
          mockReset: true,
          restoreMocks: true,
        },
      },
      {
        test: {
          name: { label: "integration", color: "cyan" },
          include: [
            "tests/*.integration.test.ts",
            "tests/*.integration.test.tsx",
          ],
          environment: "node",
          clearMocks: true,
          mockReset: true,
          restoreMocks: true,
        },
      },
    ],
  },
});
