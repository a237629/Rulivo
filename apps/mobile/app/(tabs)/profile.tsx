import { useRouter } from "expo-router";
import { Screen } from "../../src/components/screen.js";

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <Screen
      action={{
        labelKey: "navigation.openSettings",
        onPress: () => {
          router.push("/settings");
        }
      }}
      titleKey="navigation.profile"
    />
  );
}
