import { describe, expect, it } from "vitest";
import { applicationName } from "./index.js";

describe("admin skeleton", () => {
  it("has an application identity", () => {
    expect(applicationName).toBe("RULIVO admin");
  });
});
