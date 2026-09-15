import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <View className="bg-background flex-1 items-center justify-center gap-3 p-6">
      <Stack.Screen options={{ title: "Not found" }} />
      <Text variant="large">This screen does not exist.</Text>
      <Link href="/">
        <Text className="text-primary">Back to parking requests</Text>
      </Link>
    </View>
  );
}
