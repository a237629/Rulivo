import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { AppPath, SessionSnapshot } from "../navigation/policy";
import type { UserPreferences } from "../preferences/model";

interface SessionContextValue extends SessionSnapshot {
  accessToken?: string;
  completeOnboarding: (preferences: UserPreferences) => void;
  onboardingPreferences?: UserPreferences;
  pendingPath?: AppPath;
  setPendingPath: (path?: AppPath) => void;
  signIn: (accessToken?: string) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string>();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [onboardingPreferences, setOnboardingPreferences] = useState<UserPreferences>();
  const [pendingPath, setPendingPath] = useState<AppPath>();

  const value = useMemo<SessionContextValue>(
    () => ({
      authenticated,
      ...(accessToken === undefined ? {} : { accessToken }),
      completeOnboarding: (preferences) => {
        setOnboardingPreferences(preferences);
        setOnboardingComplete(true);
      },
      onboardingComplete,
      ...(onboardingPreferences === undefined ? {} : { onboardingPreferences }),
      ...(pendingPath === undefined ? {} : { pendingPath }),
      setPendingPath,
      signIn: (token) => {
        setAccessToken(token);
        setAuthenticated(true);
      },
      signOut: () => {
        setAccessToken(undefined);
        setAuthenticated(false);
      }
    }),
    [accessToken, authenticated, onboardingComplete, onboardingPreferences, pendingPath]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
