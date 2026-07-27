import { describe, expect, it } from "vitest";
import { applicationName } from "./index.js";

describe("analytics worker skeleton", () => {
  it("has an application identity", () => {
    expect(applicationName).toBe("RULIVO analytics worker");
  });
});
