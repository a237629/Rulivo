import { describe, expect, it } from "vitest";
import { applicationName } from "./index.js";

describe("web skeleton", () => {
  it("has an application identity", () => {
    expect(applicationName).toBe("RULIVO web");
  });
});
