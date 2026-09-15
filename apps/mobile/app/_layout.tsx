import "@/global.css";

import { NAV_THEME, THEME } from "@/lib/theme";
import { ThemeProvider } from "expo-router/react-navigation";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useUniwind } from "uniwind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export { ErrorBoundary } from "expo-router";

function WebBackButton() {
  const router = useRouter();
  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.back()}
      className="flex-row items-center gap-1 px-2"
      accessibilityRole="button"
      accessibilityLabel="Back">
      <Icon as={ChevronLeft} className="size-6 text-foreground" />
      <Text>Back</Text>
    </Pressable>
  );
}

function RootLayoutNav() {
  const { theme } = useUniwind();
  const palette = THEME[theme === "dark" ? "dark" : "light"];

  return (
    <ThemeProvider value={NAV_THEME[theme ?? "light"]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View className="flex-1">
        <Stack
          screenOptions={{
            contentStyle: { flex: 1, backgroundColor: palette.background },
            headerStyle: { backgroundColor: palette.background },
            headerTintColor: palette.foreground,
            headerShadowVisible: false,
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="request/[id]"
            options={{
              headerBackTitle: "Back",
              headerBackVisible: true,
              ...(Platform.OS === "web"
                ? { headerLeft: () => <WebBackButton /> }
                : {}),
            }}
          />
        </Stack>
        <PortalHost />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
