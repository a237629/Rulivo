import { i18n } from "@rulivo/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../../src/auth/session";
import {
  createDefaultPreferences,
  riskUnits,
  supportedPreferenceLocales,
  tradingMarkets,
  validatePreferences,
  type UserPreferences
} from "../../src/preferences/model";

function Choice<T extends string>({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => {
              onChange(option);
            }}
            style={[styles.choice, value === option ? styles.choiceSelected : null]}
          >
            <Text style={styles.choiceText}>{t(`onboarding.options.${option}`)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function OnboardingForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useSession();
  const [preferences, setPreferences] = useState<UserPreferences>(createDefaultPreferences);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t("navigation.screenPlaceholder")}</Text>
      <Text style={styles.title}>{t("navigation.onboarding")}</Text>
      <Text style={styles.description}>{t("onboarding.description")}</Text>
      <Choice
        label={t("onboarding.locale")}
        onChange={(value) => {
          update("locale", value);
          void i18n.changeLanguage(value);
        }}
        options={supportedPreferenceLocales}
        value={preferences.locale}
      />
      <View style={styles.field}>
        <Text style={styles.label}>{t("onboarding.timeZone")}</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={(value) => {
            update("timeZone", value);
          }}
          style={styles.input}
          value={preferences.timeZone}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>{t("onboarding.defaultCurrency")}</Text>
        <TextInput
          autoCapitalize="characters"
          maxLength={3}
          onChangeText={(value) => {
            update("defaultCurrency", value.toUpperCase());
          }}
          style={styles.input}
          value={preferences.defaultCurrency}
        />
      </View>
      <Choice
        label={t("onboarding.defaultMarket")}
        onChange={(value) => {
          update("defaultMarket", value);
        }}
        options={tradingMarkets}
        value={preferences.defaultMarket}
      />
      <Choice
        label={t("onboarding.riskUnit")}
        onChange={(value) => {
          update("riskUnit", value);
        }}
        options={riskUnits}
        value={preferences.riskUnit}
      />
      {errors.length === 0 ? null : (
        <Text style={styles.error}>{t("onboarding.validationError")}</Text>
      )}
      <Button
        onPress={() => {
          const nextErrors = validatePreferences(preferences);
          setErrors(nextErrors);
          if (nextErrors.length > 0) return;
          session.completeOnboarding(preferences);
          router.replace("/auth/sign-in");
        }}
        title={t("navigation.completeOnboarding")}
      />
    </ScrollView>
  );
}

export default function OnboardingScreen() {
  return (
    <I18nextProvider i18n={i18n}>
      <OnboardingForm />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  choice: {
    backgroundColor: "#142235",
    borderColor: "#29405B",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  choiceSelected: {
    borderColor: "#2ED7A2"
  },
  choiceText: {
    color: "#F7F8FA"
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  container: {
    backgroundColor: "#07111D",
    flexGrow: 1,
    gap: 20,
    padding: 24,
    paddingBottom: 48
  },
  description: {
    color: "#9BAABC",
    fontSize: 16,
    lineHeight: 24
  },
  error: {
    color: "#FF7A90"
  },
  eyebrow: {
    color: "#2ED7A2",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4
  },
  field: {
    gap: 8
  },
  input: {
    backgroundColor: "#142235",
    borderColor: "#29405B",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F7F8FA",
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  label: {
    color: "#C7D1DD",
    fontSize: 14,
    fontWeight: "600"
  },
  title: {
    color: "#F7F8FA",
    fontSize: 32,
    fontWeight: "700"
  }
});
