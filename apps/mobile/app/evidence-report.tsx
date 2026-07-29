import { i18n } from "@rulivo/i18n";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "../src/auth/session";
import {
  fetchEvidenceReport,
  submitPatternExplanationFeedback,
  type EvidenceReport,
  type EvidenceReportPattern,
  type PatternExplanationFeedbackReason
} from "../src/evidence/evidence-report";

const feedbackReasons: PatternExplanationFeedbackReason[] = [
  "INACCURATE",
  "UNHELPFUL",
  "EVIDENCE_ERROR",
  "TONE_INAPPROPRIATE"
];

function percent(value: number): string {
  return `${String(Math.round(value * 100))}%`;
}

function PatternCard({
  accessToken,
  explanationId,
  pattern
}: {
  accessToken: string;
  explanationId: string;
  pattern: EvidenceReportPattern;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [submittedReason, setSubmittedReason] = useState<PatternExplanationFeedbackReason>();
  const [feedbackError, setFeedbackError] = useState(false);
  const limitation = (value: string) =>
    value === "INSUFFICIENT_SAMPLE" ||
    value === "INCOMPLETE_DATA" ||
    value === "RELATED_TRADES_TRUNCATED"
      ? t(`evidenceReport.limitations.${value}`)
      : value;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{t(`evidenceReport.patterns.${pattern.patternType}`)}</Text>
        <Text style={styles.badge}>{t(`evidenceReport.levels.${pattern.impact.level}`)}</Text>
      </View>
      <Text style={styles.conclusion}>{pattern.conclusion}</Text>
      <Text style={styles.section}>{t("evidenceReport.sample")}</Text>
      <View style={styles.metrics}>
        <Text style={styles.metric}>
          {t("evidenceReport.sampleSize", { count: pattern.sample.sampleSize })}
        </Text>
        <Text style={styles.metric}>
          {t("evidenceReport.counterexampleCount", {
            count: pattern.sample.counterexampleCount
          })}
        </Text>
        <Text style={styles.metric}>
          {t("evidenceReport.completeness", {
            value: percent(pattern.impact.dataCompleteness)
          })}
        </Text>
      </View>
      <Text style={styles.section}>{t("evidenceReport.impact")}</Text>
      <Text style={styles.body}>
        {t("evidenceReport.impactValue", {
          effect: pattern.impact.effectSize.toFixed(2),
          score: pattern.impact.confidenceScore
        })}
      </Text>
      <Text style={styles.section}>{t("evidenceReport.timeWindow")}</Text>
      <Text style={styles.body}>
        {pattern.timeWindow === null
          ? t("evidenceReport.noWindow")
          : t("evidenceReport.windowValue", {
              from: new Date(pattern.timeWindow.from).toLocaleDateString(),
              to: new Date(pattern.timeWindow.to).toLocaleDateString()
            })}
      </Text>
      <Text style={styles.section}>{t("evidenceReport.relatedTrades")}</Text>
      {pattern.relatedTrades.length === 0 ? (
        <Text style={styles.body}>{t("evidenceReport.noTrades")}</Text>
      ) : (
        pattern.relatedTrades.map((trade) => (
          <TouchableOpacity
            key={trade.evidenceId}
            style={styles.trade}
            onPress={() => {
              router.push({ pathname: "/trades/[tradeId]", params: { tradeId: trade.tradeId } });
            }}
          >
            <Text style={styles.tradeSymbol}>{trade.symbol}</Text>
            <Text style={styles.body}>
              {t("evidenceReport.tradeMeta", {
                date: new Date(trade.openedAt).toLocaleDateString(),
                status: trade.status
              })}
            </Text>
          </TouchableOpacity>
        ))
      )}
      <Text style={styles.section}>{t("evidenceReport.counterexamples")}</Text>
      <Text style={styles.body}>
        {pattern.counterexamples.length === 0
          ? t("evidenceReport.noCounterexamples")
          : pattern.counterexamples.map(({ symbol }) => symbol).join(" · ")}
      </Text>
      <Text style={styles.section}>{t("evidenceReport.limitationsTitle")}</Text>
      {pattern.limitations.map((item) => (
        <Text key={item} style={styles.body}>
          {t("evidenceReport.limitationItem", { value: limitation(item) })}
        </Text>
      ))}
      <Text style={styles.evidenceId}>
        {t("evidenceReport.evidenceId", { id: pattern.sample.evidenceId })}
      </Text>
      <View style={styles.feedback}>
        <Text style={styles.section}>{t("evidenceReport.feedback.title")}</Text>
        <Text style={styles.body}>{t("evidenceReport.feedback.description")}</Text>
        <View style={styles.feedbackOptions}>
          {feedbackReasons.map((reason) => (
            <TouchableOpacity
              disabled={submittedReason !== undefined}
              key={reason}
              style={[
                styles.feedbackButton,
                submittedReason === reason && styles.feedbackButtonSelected
              ]}
              onPress={() => {
                setFeedbackError(false);
                void submitPatternExplanationFeedback(
                  explanationId,
                  pattern.patternType,
                  reason,
                  accessToken
                )
                  .then(() => {
                    setSubmittedReason(reason);
                  })
                  .catch(() => {
                    setFeedbackError(true);
                  });
              }}
            >
              <Text style={styles.feedbackButtonText}>
                {t(`evidenceReport.feedback.reasons.${reason}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {submittedReason === undefined ? null : (
          <Text style={styles.feedbackSuccess}>{t("evidenceReport.feedback.saved")}</Text>
        )}
        {feedbackError ? (
          <Text style={styles.feedbackError}>{t("evidenceReport.feedback.failed")}</Text>
        ) : null}
        <Text style={styles.factNotice}>{t("evidenceReport.feedback.factNotice")}</Text>
      </View>
    </View>
  );
}

function EvidenceReportContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const session = useSession();
  const [report, setReport] = useState<EvidenceReport>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (session.accessToken === undefined) return;
    void fetchEvidenceReport(session.accessToken)
      .then(setReport)
      .catch(() => {
        setError(t("evidenceReport.loadFailed"));
      });
  }, [session.accessToken, t]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.back}>{t("navigation.goBack")}</Text>
      </TouchableOpacity>
      <Text style={styles.eyebrow}>{t("evidenceReport.eyebrow")}</Text>
      <Text style={styles.title}>{t("evidenceReport.title")}</Text>
      <Text style={styles.body}>{t("evidenceReport.description")}</Text>
      {report === undefined ? (
        <View style={styles.empty}>
          <Text style={styles.cardTitle}>{t("evidenceReport.empty")}</Text>
          <Text style={styles.body}>
            {error ??
              (session.accessToken === undefined
                ? t("evidenceReport.loginRequired")
                : t("evidenceReport.loading"))}
          </Text>
        </View>
      ) : (
        report.patterns.map((pattern) =>
          session.accessToken === undefined ? null : (
            <PatternCard
              accessToken={session.accessToken}
              explanationId={report.explanationId}
              key={pattern.patternType}
              pattern={pattern}
            />
          )
        )
      )}
    </ScrollView>
  );
}

export default function EvidenceReportScreen() {
  return (
    <I18nextProvider i18n={i18n}>
      <EvidenceReportContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  back: { color: "#2ED7A2", fontSize: 15, fontWeight: "700" },
  badge: {
    backgroundColor: "#16362F",
    borderRadius: 999,
    color: "#2ED7A2",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  body: { color: "#9BAABC", fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: "#101D2B", borderRadius: 16, gap: 10, padding: 18 },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  cardTitle: { color: "#F7F8FA", flex: 1, fontSize: 19, fontWeight: "700" },
  conclusion: { color: "#F7F8FA", fontSize: 16, lineHeight: 24 },
  container: { backgroundColor: "#07111D", flexGrow: 1, gap: 16, padding: 24, paddingTop: 56 },
  empty: { backgroundColor: "#101D2B", borderRadius: 16, gap: 8, padding: 20 },
  evidenceId: { color: "#667085", fontSize: 11, marginTop: 6 },
  eyebrow: { color: "#2ED7A2", fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  factNotice: { color: "#667085", fontSize: 12, lineHeight: 18 },
  feedback: {
    borderTopColor: "#25384B",
    borderTopWidth: 1,
    gap: 9,
    marginTop: 8,
    paddingTop: 8
  },
  feedbackButton: {
    borderColor: "#475467",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8
  },
  feedbackButtonSelected: { backgroundColor: "#16362F", borderColor: "#2ED7A2" },
  feedbackButtonText: { color: "#D0D5DD", fontSize: 12, fontWeight: "600" },
  feedbackError: { color: "#F97066", fontSize: 13 },
  feedbackOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  feedbackSuccess: { color: "#2ED7A2", fontSize: 13 },
  metric: { color: "#D0D5DD", fontSize: 13 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  section: { color: "#D0D5DD", fontSize: 13, fontWeight: "700", marginTop: 6 },
  title: { color: "#F7F8FA", fontSize: 30, fontWeight: "700" },
  trade: {
    alignItems: "center",
    borderBottomColor: "#25384B",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10
  },
  tradeSymbol: { color: "#F7F8FA", fontWeight: "700" }
});
