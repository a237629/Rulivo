import { describe, expect, it } from "vitest";
import { normalizeDeepLink, resolveBack, resolveNavigation } from "./policy";

describe("deep links", () => {
  it("normalizes app-scheme and universal links", () => {
    expect(normalizeDeepLink("rulivo://settings")).toBe("/settings");
    expect(normalizeDeepLink("https://rulivo.app/review")).toBe("/review");
  });

  it("falls back safely for unknown and malformed links", () => {
    expect(normalizeDeepLink("rulivo://unknown")).toBe("/");
    expect(normalizeDeepLink("not a valid route")).toBe("/");
  });
});

describe("navigation guards", () => {
  it("sends a new user to onboarding and preserves a protected destination", () => {
    expect(
      resolveNavigation("/settings", {
        authenticated: false,
        onboardingComplete: false
      })
    ).toEqual({
      path: "/onboarding",
      reason: "onboarding-required",
      returnTo: "/settings"
    });
  });

  it("sends an onboarded guest to sign-in", () => {
    expect(
      resolveNavigation("/evidence", {
        authenticated: false,
        onboardingComplete: true
      })
    ).toEqual({
      path: "/auth/sign-in",
      reason: "auth-required",
      returnTo: "/evidence"
    });
  });

  it("keeps authenticated users out of public entry routes", () => {
    expect(
      resolveNavigation("/auth/sign-in", {
        authenticated: true,
        onboardingComplete: true
      })
    ).toEqual({ path: "/", reason: "fallback" });
  });

  it("allows authenticated users to open protected deep links", () => {
    expect(
      resolveNavigation("rulivo://settings", {
        authenticated: true,
        onboardingComplete: true
      })
    ).toEqual({ path: "/settings", reason: "allowed" });
    expect(
      resolveNavigation("/evidence-report", {
        authenticated: true,
        onboardingComplete: true
      })
    ).toEqual({ path: "/evidence-report", reason: "allowed" });
  });
});

describe("back behavior", () => {
  it("returns to the latest route permitted by the current session", () => {
    expect(
      resolveBack(["/", "/review", "/settings"], {
        authenticated: true,
        onboardingComplete: true
      })
    ).toEqual({ path: "/review", reason: "allowed" });
  });

  it("never returns a signed-out user to protected history", () => {
    expect(
      resolveBack(["/auth/sign-in", "/settings"], {
        authenticated: false,
        onboardingComplete: true
      })
    ).toEqual({ path: "/auth/sign-in", reason: "allowed" });
  });
});
