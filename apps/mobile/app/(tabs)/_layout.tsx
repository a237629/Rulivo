import { i18n } from "@rulivo/i18n";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: i18n.t("navigation.home") }} />
      <Tabs.Screen name="review" options={{ title: i18n.t("navigation.review") }} />
      <Tabs.Screen name="evidence" options={{ title: i18n.t("navigation.evidence") }} />
      <Tabs.Screen name="plan" options={{ title: i18n.t("navigation.plan") }} />
      <Tabs.Screen name="profile" options={{ title: i18n.t("navigation.profile") }} />
    </Tabs>
  );
}
