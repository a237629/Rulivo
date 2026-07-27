import { useRouter } from "expo-router";
import { useSession } from "../../src/auth/session.js";
import { Screen } from "../../src/components/screen.js";

export default function SignInScreen() {
  const router = useRouter();
  const session = useSession();
  return (
    <Screen
      action={{
        labelKey: "navigation.signIn",
        onPress: () => {
          const destination = session.pendingPath ?? "/";
          session.signIn();
          session.setPendingPath(undefined);
          router.replace(destination);
        }
      }}
      descriptionKey="navigation.signInDescription"
      titleKey="navigation.signIn"
    />
  );
}
