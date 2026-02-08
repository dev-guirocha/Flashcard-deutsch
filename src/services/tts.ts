import * as Speech from "expo-speech";

export function speakDe(text: string) {
  if (!text) return;
  try {
    Speech.stop();
    Speech.speak(text, {
      language: "de-DE",
      rate: 0.9,
    });
  } catch {
    // ignore
  }
}
