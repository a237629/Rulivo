import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { I18nextProvider, useTranslation } from "react-i18next";
import { i18n } from "@rulivo/i18n";
import type { TradeResult } from "../../src/trades/trade-list";

const results: (TradeResult | undefined)[] = [undefined, "WIN", "LOSS", "BREAKEVEN", "UNKNOWN"];

function TradeListContent() {
  const { t } = useTranslation();
  const [resultIndex, setResultIndex] = useState(0);
  const [message, setMessage] = useState<string>();
  const result = results[resultIndex];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t("navigation.review")}</Text>
      <Text style={styles.title}>{t("tradeList.title")}</Text>
      <Text style={styles.description}>{t("tradeList.description")}</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={t("tradeList.dateFrom")}
          placeholder={t("tradeList.dateFrom")}
          placeholderTextColor="#667085"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel={t("tradeList.dateTo")}
          placeholder={t("tradeList.dateTo")}
          placeholderTextColor="#667085"
          style={styles.input}
        />
      </View>
      <TextInput
        accessibilityLabel={t("tradeList.account")}
        placeholder={t("tradeList.account")}
        placeholderTextColor="#667085"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel={t("tradeList.market")}
        placeholder={t("tradeList.market")}
        placeholderTextColor="#667085"
        style={styles.input}
      />
      <TextInput
        accessibilityLabel={t("tradeList.strategy")}
        placeholder={t("tradeList.strategy")}
        placeholderTextColor="#667085"
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.filter}
        onPress={() => {
          setResultIndex((resultIndex + 1) % results.length);
        }}
      >
        <Text style={styles.filterText}>
          {t("tradeList.resultValue", {
            result: t(`tradeList.results.${result ?? "ALL"}`)
          })}
        </Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={t("tradeList.scoreMin")}
          keyboardType="number-pad"
          placeholder={t("tradeList.scoreMin")}
          placeholderTextColor="#667085"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel={t("tradeList.scoreMax")}
          keyboardType="number-pad"
          placeholder={t("tradeList.scoreMax")}
          placeholderTextColor="#667085"
          style={styles.input}
        />
      </View>
      <TouchableOpacity
        style={styles.primary}
        onPress={() => {
          setMessage(t("tradeList.loginRequired"));
        }}
      >
        <Text style={styles.buttonText}>{t("tradeList.apply")}</Text>
      </TouchableOpacity>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{t("tradeList.empty")}</Text>
        <Text style={styles.description}>{message ?? t("tradeList.emptyDescription")}</Text>
      </View>
    </ScrollView>
  );
}

export default function ReviewScreen() {
  return (
    <I18nextProvider i18n={i18n}>
      <TradeListContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  buttonText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  container: { backgroundColor: "#07111D", flexGrow: 1, gap: 14, padding: 24, paddingTop: 64 },
  description: { color: "#9BAABC", fontSize: 14, lineHeight: 20 },
  empty: { backgroundColor: "#101D2B", borderRadius: 12, gap: 8, padding: 18 },
  emptyTitle: { color: "#F7F8FA", fontSize: 18, fontWeight: "700" },
  eyebrow: { color: "#2ED7A2", fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  filter: { backgroundColor: "#101D2B", borderRadius: 10, padding: 14 },
  filterText: { color: "#F7F8FA" },
  input: {
    backgroundColor: "#101D2B",
    borderColor: "#344054",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F7F8FA",
    flex: 1,
    padding: 13
  },
  primary: { backgroundColor: "#1570EF", borderRadius: 10, padding: 14 },
  row: { flexDirection: "row", gap: 10 },
  title: { color: "#F7F8FA", fontSize: 30, fontWeight: "700" }
});
