import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { i18n } from "@rulivo/i18n";

const sectionKeys = ["chart", "executions", "screenshots", "notes", "voice", "rules"] as const;

function TradeDetailContent() {
  const { tradeId } = useLocalSearchParams<{ tradeId: string }>();
  const { t } = useTranslation();
  const [followUpText, setFollowUpText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t("tradeDetail.eyebrow")}</Text>
      <Text style={styles.title}>{t("tradeDetail.title")}</Text>
      <Text style={styles.description}>{t("tradeDetail.tradeId", { tradeId })}</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.cardTitle}>{t("tradeDetail.resultScore")}</Text>
        <Text style={styles.score}>{t("tradeDetail.scoreEmpty")}</Text>
        <Text style={styles.description}>{t("tradeDetail.scoreFormula")}</Text>
        <Text style={styles.method}>{t("tradeDetail.scoreRisk")}</Text>
        <Text style={styles.method}>{t("tradeDetail.scoreTarget")}</Text>
        <Text style={styles.method}>{t("tradeDetail.scoreOutcome")}</Text>
      </View>
      <View style={styles.executionCard}>
        <Text style={styles.cardTitle}>{t("tradeDetail.executionScore")}</Text>
        <Text style={styles.score}>{t("tradeDetail.scoreUnknown")}</Text>
        <Text style={styles.description}>{t("tradeDetail.executionFormula")}</Text>
        <Text style={styles.method}>{t("tradeDetail.unknownPolicy")}</Text>
        <Text style={styles.method}>{t("tradeDetail.executionDimensions")}</Text>
      </View>
      <View style={styles.quadrantCard}>
        <Text style={styles.cardTitle}>{t("tradeDetail.quadrantTitle")}</Text>
        <Text style={styles.score}>{t("tradeDetail.quadrantUnknown")}</Text>
        <Text style={styles.method}>{t("tradeDetail.quadrantExcellent")}</Text>
        <Text style={styles.method}>{t("tradeDetail.quadrantQualified")}</Text>
        <Text style={styles.method}>{t("tradeDetail.quadrantDangerous")}</Text>
        <Text style={styles.method}>{t("tradeDetail.quadrantError")}</Text>
        <Text style={styles.description}>{t("tradeDetail.quadrantUnknownPolicy")}</Text>
      </View>
      <View style={styles.followUpCard}>
        <Text style={styles.cardTitle}>{t("tradeDetail.followUpTitle")}</Text>
        <Text style={styles.description}>{t("tradeDetail.followUpLimit")}</Text>
        <Text style={styles.method}>{t("tradeDetail.followUpPlaceholderQuestion")}</Text>
        <View style={styles.optionRow}>
          {["yes", "no", "notSure"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.option, selectedOption === option ? styles.optionSelected : null]}
              onPress={() => {
                setSelectedOption(option);
                setFollowUpText("");
              }}
            >
              <Text style={styles.optionText}>{t(`tradeDetail.followUpOptions.${option}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          accessibilityLabel={t("tradeDetail.followUpFreeText")}
          onChangeText={(value) => {
            setFollowUpText(value);
            if (value.length > 0) setSelectedOption(undefined);
          }}
          placeholder={t("tradeDetail.followUpFreeText")}
          placeholderTextColor="#667085"
          style={styles.followUpInput}
          value={followUpText}
        />
        <TouchableOpacity style={styles.submit}>
          <Text style={styles.submitText}>{t("tradeDetail.followUpSubmit")}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>{t("tradeDetail.reviewSummaryTitle")}</Text>
        <Text style={styles.description}>{t("tradeDetail.reviewSummaryDescription")}</Text>
        <Text style={styles.method}>{t("tradeDetail.reviewSummarySections")}</Text>
        <Text style={styles.method}>{t("tradeDetail.reviewSummaryEvidence")}</Text>
      </View>
      {sectionKeys.map((section) => (
        <View key={section} style={styles.card}>
          <Text style={styles.cardTitle}>{t(`tradeDetail.${section}`)}</Text>
          <Text style={styles.description}>{t("tradeDetail.loginRequired")}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

export default function TradeDetailScreen() {
  return (
    <I18nextProvider i18n={i18n}>
      <TradeDetailContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#101D2B", borderRadius: 12, gap: 8, padding: 18 },
  cardTitle: { color: "#F7F8FA", fontSize: 18, fontWeight: "700" },
  container: { backgroundColor: "#07111D", flexGrow: 1, gap: 14, padding: 24, paddingTop: 64 },
  description: { color: "#9BAABC", fontSize: 14, lineHeight: 20 },
  eyebrow: { color: "#2ED7A2", fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  executionCard: { backgroundColor: "#16243B", borderRadius: 12, gap: 8, padding: 18 },
  followUpCard: { backgroundColor: "#251F18", borderRadius: 12, gap: 10, padding: 18 },
  followUpInput: {
    backgroundColor: "#101D2B",
    borderColor: "#475467",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F7F8FA",
    padding: 12
  },
  method: { color: "#C6D0DC", fontSize: 13, lineHeight: 19 },
  quadrantCard: { backgroundColor: "#2A2134", borderRadius: 12, gap: 8, padding: 18 },
  option: {
    backgroundColor: "#344054",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionSelected: { backgroundColor: "#1570EF" },
  optionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  score: { color: "#2ED7A2", fontSize: 28, fontWeight: "800" },
  scoreCard: { backgroundColor: "#122C2A", borderRadius: 12, gap: 8, padding: 18 },
  submit: { backgroundColor: "#1570EF", borderRadius: 10, padding: 12 },
  submitText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  summaryCard: { backgroundColor: "#1D2638", borderRadius: 12, gap: 8, padding: 18 },
  title: { color: "#F7F8FA", fontSize: 30, fontWeight: "700" }
});
