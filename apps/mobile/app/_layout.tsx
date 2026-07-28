import { Stack } from "expo-router";
import { NavigationGuard } from "../src/navigation/guard";
import { SessionProvider } from "../src/auth/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <NavigationGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </SessionProvider>
  );
}
