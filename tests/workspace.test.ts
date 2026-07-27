import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("workspace baseline", () => {
  it("enables strict TypeScript", () => {
    const config = JSON.parse(
      readFileSync(resolve("packages/typescript-config/base.json"), "utf8")
    ) as { compilerOptions?: { strict?: boolean } };

    expect(config.compilerOptions?.strict).toBe(true);
  });
});
