import { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import { File } from "expo-file-system";
import { useTranslation } from "react-i18next";
import { formatDuration, type PreparedVoiceRecording } from "./voice-upload";

export function VoiceRecorder() {
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const state = useAudioRecorderState(recorder, 250);
  const [paused, setPaused] = useState(false);
  const [recording, setRecording] = useState<PreparedVoiceRecording>();
  const [message, setMessage] = useState<string>();

  async function start() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setMessage(t("voiceRecording.permissionDenied"));
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPaused(false);
    setRecording(undefined);
    setMessage(undefined);
  }

  function pauseOrResume() {
    if (paused) recorder.record();
    else recorder.pause();
    setPaused(!paused);
  }

  async function stop() {
    const durationMs = state.durationMillis;
    await recorder.stop();
    if (!recorder.uri || durationMs <= 0) {
      setMessage(t("voiceRecording.failed"));
      return;
    }
    setRecording({
      durationMs,
      mediaType: Platform.OS === "web" ? "audio/webm" : "audio/mp4",
      uri: recorder.uri
    });
    setPaused(false);
    setMessage(t("voiceRecording.ready"));
  }

  function discard() {
    if (recording) new File(recording.uri).delete();
    setRecording(undefined);
    setMessage(t("voiceRecording.deleted"));
  }

  const duration = recording?.durationMs ?? state.durationMillis;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t("voiceRecording.title")}</Text>
      <Text style={styles.description}>{t("voiceRecording.permissionExplanation")}</Text>
      <Text style={styles.duration}>{formatDuration(duration)}</Text>
      {!state.isRecording && !paused && !recording ? (
        <TouchableOpacity style={styles.primary} onPress={() => void start()}>
          <Text style={styles.buttonText}>{t("voiceRecording.start")}</Text>
        </TouchableOpacity>
      ) : null}
      {state.isRecording || paused ? (
        <View style={styles.row}>
          <TouchableOpacity style={styles.secondary} onPress={pauseOrResume}>
            <Text style={styles.buttonText}>
              {t(paused ? "voiceRecording.resume" : "voiceRecording.pause")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primary} onPress={() => void stop()}>
            <Text style={styles.buttonText}>{t("voiceRecording.stop")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {recording ? (
        <View style={styles.row}>
          <TouchableOpacity style={styles.danger} onPress={discard}>
            <Text style={styles.buttonText}>{t("voiceRecording.delete")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => {
              setMessage(t("voiceRecording.loginRequired"));
            }}
          >
            <Text style={styles.buttonText}>{t("voiceRecording.upload")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {message ? <Text style={styles.status}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  card: { backgroundColor: "#101D2B", borderRadius: 12, gap: 14, padding: 18 },
  danger: { backgroundColor: "#B42318", borderRadius: 10, flex: 1, padding: 13 },
  description: { color: "#9BAABC", fontSize: 14, lineHeight: 20 },
  duration: { color: "#F7F8FA", fontSize: 32, fontVariant: ["tabular-nums"], fontWeight: "700" },
  primary: { backgroundColor: "#1570EF", borderRadius: 10, flex: 1, padding: 13 },
  row: { flexDirection: "row", gap: 10 },
  secondary: { backgroundColor: "#344054", borderRadius: 10, flex: 1, padding: 13 },
  status: { color: "#2ED7A2", fontSize: 14 },
  title: { color: "#F7F8FA", fontSize: 20, fontWeight: "700" }
});
