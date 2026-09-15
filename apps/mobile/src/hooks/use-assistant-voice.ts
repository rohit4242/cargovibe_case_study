import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useState } from "react";

export function useAssistantVoice({
  send,
  onError,
}: {
  send: (text: string) => Promise<string | undefined>;
  onError: (message: string) => void;
}) {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    if (!event.isFinal) {
      return;
    }
    const transcript = event.results[0]?.transcript?.trim();
    if (!transcript) {
      return;
    }
    void send(transcript).then((reply) => {
      if (reply?.trim()) {
        Speech.speak(reply, { language: "en-US" });
      }
    });
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    if (event.error === "aborted" || event.error === "no-speech") {
      return;
    }
    onError(event.message || event.error || "Speech recognition failed");
  });

  const toggle = useCallback(async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    Speech.stop();
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      onError("Allow the microphone and speech recognition to use voice.");
      return;
    }

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: false,
      continuous: false,
    });
  }, [listening, onError]);

  return { listening, toggle };
}
