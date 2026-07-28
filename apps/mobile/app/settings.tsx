import { useRouter } from "expo-router";
import { Screen } from "../src/components/screen";

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <Screen
      action={{
        labelKey: "navigation.goBack",
        onPress: () => {
          router.back();
        }
      }}
      titleKey="navigation.settings"
    />
  );
}
