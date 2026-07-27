export const appPaths = ["/", "/review", "/evidence", "/plan", "/profile", "/settings"] as const;

export type AppPath = (typeof appPaths)[number];
export type PublicPath = "/onboarding" | "/auth/sign-in";
export type KnownPath = AppPath | PublicPath;

export interface SessionSnapshot {
  authenticated: boolean;
  onboardingComplete: boolean;
}

export interface NavigationDecision {
  path: KnownPath;
  reason: "allowed" | "auth-required" | "onboarding-required" | "fallback";
  returnTo?: AppPath;
}

function isAppPath(path: string): path is AppPath {
  return (appPaths as readonly string[]).includes(path);
}

function isKnownPath(path: string): path is KnownPath {
  return isAppPath(path) || path === "/onboarding" || path === "/auth/sign-in";
}

export function normalizeDeepLink(link: string): KnownPath {
  try {
    const url = new URL(link);
    const candidate =
      url.protocol === "rulivo:"
        ? `/${url.hostname}${url.pathname}`.replace(/\/+$/, "") || "/"
        : url.pathname.replace(/\/+$/, "") || "/";
    return isKnownPath(candidate) ? candidate : "/";
  } catch {
    const candidate = link.startsWith("/") ? link.replace(/\/+$/, "") || "/" : `/${link}`;
    return isKnownPath(candidate) ? candidate : "/";
  }
}

export function resolveNavigation(
  requestedPath: string,
  session: SessionSnapshot
): NavigationDecision {
  const path = normalizeDeepLink(requestedPath);

  if (!session.onboardingComplete) {
    if (path === "/onboarding") return { path, reason: "allowed" };
    return {
      path: "/onboarding",
      reason: "onboarding-required",
      ...(isAppPath(path) ? { returnTo: path } : {})
    };
  }

  if (!session.authenticated) {
    if (path === "/auth/sign-in") return { path, reason: "allowed" };
    return {
      path: "/auth/sign-in",
      reason: "auth-required",
      ...(isAppPath(path) ? { returnTo: path } : {})
    };
  }

  if (path === "/onboarding" || path === "/auth/sign-in") {
    return { path: "/", reason: "fallback" };
  }

  return { path, reason: "allowed" };
}

export function resolveBack(
  history: readonly string[],
  session: SessionSnapshot
): NavigationDecision {
  for (let index = history.length - 2; index >= 0; index -= 1) {
    const decision = resolveNavigation(history[index] ?? "/", session);
    if (decision.reason === "allowed") return decision;
  }
  return resolveNavigation("/", session);
}
