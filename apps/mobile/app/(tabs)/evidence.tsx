import { useState } from "react";
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { I18nextProvider, useTranslation } from "react-i18next";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { i18n } from "@rulivo/i18n";
import type { PreparedImage } from "../../src/evidence/image-upload";
import { VoiceRecorder } from "../../src/evidence/voice-recorder";

function EvidenceContent() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState(false);
  const [image, setImage] = useState<PreparedImage>();
  const [message, setMessage] = useState<string>();

  async function choose(source: "CAMERA" | "LIBRARY") {
    const permission =
      source === "CAMERA"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage(t("imageUpload.permissionDenied"));
      return;
    }
    const result =
      source === "CAMERA"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ["images"]
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ["images"]
          });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    // Expo retains this compatibility API across native and web targets in SDK 57.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const prepared = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: Math.min(asset.width, 2048) } }],
      { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
    );
    setImage({
      fileName: `evidence-${String(Date.now())}.jpg`,
      height: prepared.height,
      source,
      uri: prepared.uri,
      width: prepared.width
    });
    setMessage(t("imageUpload.ready"));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{t("navigation.evidence")}</Text>
      <Text style={styles.title}>{t("imageUpload.title")}</Text>
      <Text style={styles.description}>{t("imageUpload.description")}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => void choose("CAMERA")}>
          <Text style={styles.buttonText}>{t("imageUpload.camera")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => void choose("LIBRARY")}>
          <Text style={styles.buttonText}>{t("imageUpload.library")}</Text>
        </TouchableOpacity>
      </View>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="contain" />
      ) : null}
      <View style={styles.consent}>
        <Switch value={consent} onValueChange={setConsent} />
        <Text style={styles.description}>{t("imageUpload.consent")}</Text>
      </View>
      <TouchableOpacity
        disabled={!consent || !image}
        style={[styles.button, (!consent || !image) && styles.disabled]}
        onPress={() => {
          setMessage(t("imageUpload.loginRequired"));
        }}
      >
        <Text style={styles.buttonText}>{t("imageUpload.upload")}</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.status}>{message}</Text> : null}
      <VoiceRecorder />
    </ScrollView>
  );
}

export default function EvidenceScreen() {
  return (
    <I18nextProvider i18n={i18n}>
      <EvidenceContent />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#1570EF", borderRadius: 10, flex: 1, padding: 14 },
  buttonText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  consent: { alignItems: "center", flexDirection: "row", gap: 10 },
  container: { backgroundColor: "#07111D", flexGrow: 1, gap: 18, padding: 24, paddingTop: 64 },
  description: { color: "#9BAABC", flex: 1, fontSize: 15, lineHeight: 22 },
  disabled: { opacity: 0.4 },
  eyebrow: { color: "#2ED7A2", fontSize: 12, fontWeight: "700", letterSpacing: 1.4 },
  preview: { backgroundColor: "#101D2B", borderRadius: 12, height: 260, width: "100%" },
  row: { flexDirection: "row", gap: 12 },
  status: { color: "#2ED7A2", fontSize: 14 },
  title: { color: "#F7F8FA", fontSize: 30, fontWeight: "700" }
});
