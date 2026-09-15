import Constants from "expo-constants";
import { Platform } from "react-native";

function lanHost(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.experienceUrl;
  const match = String(hostUri ?? "").match(/(\d+\.\d+\.\d+\.\d+)/);
  return match?.[1];
}

export function getApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv;
  }

  const host = lanHost();
  if (host && Platform.OS !== "web") {
    return `http://${host}:8787`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8787";
  }

  return "http://localhost:8787";
}

export const API_URL = getApiUrl();

export function getLiveWsUrl(): string {
  return `${API_URL.replace(/^http/i, "ws")}/chat/live`;
}
