import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { AppPath, SessionSnapshot } from "../navigation/policy.js";
import type { UserPreferences } from "../preferences/model.js";

interface SessionContextValue extends SessionSnapshot {
  completeOnboarding: (preferences: UserPreferences) => void;
  onboardingPreferences?: UserPreferences;
  pendingPath?: AppPath;
  setPendingPath: (path?: AppPath) => void;
  signIn: () => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [authenticated, setAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingPreferences, setOnboardingPreferences] = useState<UserPreferences>();
  const [pendingPath, setPendingPath] = useState<AppPath>();

  const value = useMemo<SessionContextValue>(
    () => ({
      authenticated,
      completeOnboarding: (preferences) => {
        setOnboardingPreferences(preferences);
        setOnboardingComplete(true);
      },
      onboardingComplete,
      ...(onboardingPreferences === undefined ? {} : { onboardingPreferences }),
      ...(pendingPath === undefined ? {} : { pendingPath }),
      setPendingPath,
      signIn: () => {
        setAuthenticated(true);
      },
      signOut: () => {
        setAuthenticated(false);
      }
    }),
    [authenticated, onboardingComplete, onboardingPreferences, pendingPath]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
