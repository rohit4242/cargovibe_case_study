import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import { THEME } from "@/lib/theme";
import { Tabs } from "expo-router";
import { ClipboardList, Home, MessageCircle } from "lucide-react-native";
import { useUniwind } from "uniwind";

export default function TabLayout() {
  const { theme } = useUniwind();
  const palette = THEME[theme === "dark" ? "dark" : "light"];

  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerRight: () => <ThemeToggle />,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.mutedForeground,
        tabBarStyle: {
          backgroundColor: palette.background,
          borderTopColor: palette.border,
        },
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.foreground,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon as={Home} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => (
            <Icon as={ClipboardList} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color, size }) => (
            <Icon as={MessageCircle} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
