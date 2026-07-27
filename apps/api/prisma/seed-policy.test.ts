import { describe, expect, it } from "vitest";
import { assertSeedAllowed } from "./seed-policy.js";

describe("seed policy", () => {
  it("blocks production seed data", () => {
    expect(() => {
      assertSeedAllowed("production");
    }).toThrow("disabled in production");
  });

  it("allows local and test seed data", () => {
    expect(() => {
      assertSeedAllowed("local");
    }).not.toThrow();
    expect(() => {
      assertSeedAllowed("test");
    }).not.toThrow();
  });
});
