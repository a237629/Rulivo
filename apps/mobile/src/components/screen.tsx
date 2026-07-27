import { i18n } from "@rulivo/i18n";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Button, StyleSheet, Text, View } from "react-native";

interface ScreenProps {
  action?: {
    labelKey: string;
    onPress: () => void;
  };
  descriptionKey?: string;
  titleKey: string;
}

function ScreenContent({ action, descriptionKey, titleKey }: ScreenProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{t("navigation.screenPlaceholder")}</Text>
      <Text style={styles.title}>{t(titleKey)}</Text>
      {descriptionKey === undefined ? null : (
        <Text style={styles.description}>{t(descriptionKey)}</Text>
      )}
      {action === undefined ? null : <Button onPress={action.onPress} title={t(action.labelKey)} />}
    </View>
  );
}

export function Screen(props: ScreenProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ScreenContent {...props} />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch",
    backgroundColor: "#07111D",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24
  },
  description: {
    color: "#9BAABC",
    fontSize: 16,
    lineHeight: 24
  },
  eyebrow: {
    color: "#2ED7A2",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4
  },
  title: {
    color: "#F7F8FA",
    fontSize: 32,
    fontWeight: "700"
  }
});
