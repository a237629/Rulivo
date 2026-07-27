import { Stack } from "expo-router";
import { NavigationGuard } from "../src/navigation/guard.js";
import { SessionProvider } from "../src/auth/session.js";

export default function RootLayout() {
  return (
    <SessionProvider>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}
